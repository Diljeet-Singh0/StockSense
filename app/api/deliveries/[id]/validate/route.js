import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function POST(request, { params }) {
  try {
    const { id: userId } = getUserFromHeaders(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const delivery = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        lines: {
          include: { product: true },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery order not found' }, { status: 404 });
    }

    if (delivery.status === 'DONE') {
      return NextResponse.json({ error: 'Delivery order is already validated' }, { status: 400 });
    }

    if (delivery.status === 'CANCELED') {
      return NextResponse.json({ error: 'Cannot validate a canceled delivery' }, { status: 400 });
    }

    // Check available stock for each line at the delivery location
    const insufficientStockErrors = [];
    for (const line of delivery.lines) {
      const stock = await prisma.stockLevel.findUnique({
        where: {
          productId_locationId: {
            productId: line.productId,
            locationId: delivery.locationId,
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
          error: `Insufficient stock for delivery: ${details}`,
          insufficientItems: insufficientStockErrors,
        },
        { status: 400 }
      );
    }

    // Execute atomic transaction: update status, decrease stock levels, insert ledger moves
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark as DONE
      const updatedDelivery = await tx.deliveryOrder.update({
        where: { id },
        data: {
          status: 'DONE',
          validatedAt: new Date(),
        },
      });

      // 2. Decrease stock and record stock move for each line
      for (const line of delivery.lines) {
        const qty = Number(line.quantity);

        await tx.stockLevel.update({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: delivery.locationId,
            },
          },
          data: {
            quantity: { decrement: qty },
          },
        });

        await tx.stockMove.create({
          data: {
            productId: line.productId,
            locationId: delivery.locationId,
            quantityChange: -qty, // Negative quantity change
            moveType: 'DELIVERY',
            referenceId: delivery.id,
            referenceType: 'delivery',
            createdBy: userId,
          },
        });
      }

      return updatedDelivery;
    });

    return NextResponse.json({ delivery: result, message: 'Delivery validated successfully' });
  } catch (error) {
    console.error('Delivery validate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
