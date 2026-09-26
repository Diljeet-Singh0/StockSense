import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function POST(request, { params }) {
  try {
    const { id: userId } = getUserFromHeaders(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const transfer = await prisma.internalTransfer.findUnique({
      where: { id },
      include: {
        lines: { include: { product: true } },
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (transfer.status === 'DONE') {
      return NextResponse.json({ error: 'Transfer is already validated' }, { status: 400 });
    }

    if (transfer.status === 'CANCELED') {
      return NextResponse.json({ error: 'Cannot validate a canceled transfer' }, { status: 400 });
    }

    // Verify sufficient stock at source location
    const insufficientStockErrors = [];
    for (const line of transfer.lines) {
      const stock = await prisma.stockLevel.findUnique({
        where: {
          productId_locationId: {
            productId: line.productId,
            locationId: transfer.sourceLocationId,
          },
        },
      });

      const currentQty = stock ? Number(stock.quantity) : 0;
      const requestedQty = Number(line.quantity);

      if (currentQty < requestedQty) {
        insufficientStockErrors.push({
          productName: line.product.name,
          sku: line.product.sku,
          available: currentQty,
          requested: requestedQty,
        });
      }
    }

    if (insufficientStockErrors.length > 0) {
      const details = insufficientStockErrors
        .map((e) => `${e.productName} (${e.sku}): Available ${e.available}, Requested ${e.requested}`)
        .join('; ');
      return NextResponse.json(
        {
          error: `Insufficient stock at source location: ${details}`,
          insufficientItems: insufficientStockErrors,
        },
        { status: 400 }
      );
    }

    // Atomic transaction: decrease source, increase dest, log both ledger moves
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark transfer as DONE
      const updatedTransfer = await tx.internalTransfer.update({
        where: { id },
        data: {
          status: 'DONE',
          validatedAt: new Date(),
        },
      });

      // 2. Loop through lines
      for (const line of transfer.lines) {
        const qty = Number(line.quantity);

        // Decrease source
        await tx.stockLevel.update({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.sourceLocationId,
            },
          },
          data: {
            quantity: { decrement: qty },
          },
        });

        // Increase destination
        await tx.stockLevel.upsert({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.destLocationId,
            },
          },
          update: {
            quantity: { increment: qty },
          },
          create: {
            productId: line.productId,
            locationId: transfer.destLocationId,
            quantity: qty,
          },
        });

        // Outgoing ledger entry from source
        await tx.stockMove.create({
          data: {
            productId: line.productId,
            locationId: transfer.sourceLocationId,
            quantityChange: -qty,
            moveType: 'TRANSFER_OUT',
            referenceId: transfer.id,
            referenceType: 'internal_transfer',
            createdBy: userId,
          },
        });

        // Incoming ledger entry to destination
        await tx.stockMove.create({
          data: {
            productId: line.productId,
            locationId: transfer.destLocationId,
            quantityChange: qty,
            moveType: 'TRANSFER_IN',
            referenceId: transfer.id,
            referenceType: 'internal_transfer',
            createdBy: userId,
          },
        });
      }

      return updatedTransfer;
    });

    return NextResponse.json({ transfer: result, message: 'Transfer validated successfully' });
  } catch (error) {
    console.error('Transfer validate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
