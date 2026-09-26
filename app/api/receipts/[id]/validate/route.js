import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function POST(request, { params }) {
  try {
    const { id: userId } = getUserFromHeaders(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    if (receipt.status === 'DONE') {
      return NextResponse.json({ error: 'Receipt is already validated' }, { status: 400 });
    }

    if (receipt.status === 'CANCELED') {
      return NextResponse.json({ error: 'Cannot validate a canceled receipt' }, { status: 400 });
    }

    // Critical PRD Rule: Always update stock_levels and insert into stock_moves inside the same transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark receipt as DONE
      const updatedReceipt = await tx.receipt.update({
        where: { id },
        data: {
          status: 'DONE',
          validatedAt: new Date(),
        },
      });

      // 2. Loop through lines, increase stock levels, record ledger
      for (const line of receipt.lines) {
        const qty = Number(line.quantity);

        // Upsert stock level
        await tx.stockLevel.upsert({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: receipt.locationId,
            },
          },
          update: {
            quantity: { increment: qty },
          },
          create: {
            productId: line.productId,
            locationId: receipt.locationId,
            quantity: qty,
          },
        });

        // Insert stock move entry into ledger
        await tx.stockMove.create({
          data: {
            productId: line.productId,
            locationId: receipt.locationId,
            quantityChange: qty,
            moveType: 'RECEIPT',
            referenceId: receipt.id,
            referenceType: 'receipt',
            createdBy: userId,
          },
        });
      }

      return updatedReceipt;
    });

    return NextResponse.json({ receipt: result, message: 'Receipt validated successfully' });
  } catch (error) {
    console.error('Receipt validate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
