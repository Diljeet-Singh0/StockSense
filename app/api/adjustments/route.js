import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const locationId = searchParams.get('locationId');

    const where = {};
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;

    const adjustments = await prisma.stockAdjustment.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, uom: true } },
        location: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      adjustments: adjustments.map((a) => ({
        ...a,
        countedQty: Number(a.countedQty),
        previousQty: Number(a.previousQty),
        difference: Number(a.difference),
      })),
    });
  } catch (error) {
    console.error('Adjustments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id: userId } = getUserFromHeaders(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { productId, locationId, countedQty, reason } = body;

    if (!productId || !locationId || countedQty === undefined || countedQty === null) {
      return NextResponse.json(
        { error: 'Product, location, and counted quantity are required' },
        { status: 400 }
      );
    }

    const countedNum = Number(countedQty);
    if (isNaN(countedNum) || countedNum < 0) {
      return NextResponse.json({ error: 'Counted quantity must be a non-negative number' }, { status: 400 });
    }

    // Get current stock
    const currentStockLevel = await prisma.stockLevel.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
    });

    const previousQty = currentStockLevel ? Number(currentStockLevel.quantity) : 0;
    const difference = countedNum - previousQty;

    // Transaction: update/upsert stock_level, record stock_adjustment, record stock_move
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update stock level to exact counted quantity
      await tx.stockLevel.upsert({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
        update: {
          quantity: countedNum,
        },
        create: {
          productId,
          locationId,
          quantity: countedNum,
        },
      });

      // 2. Record stock adjustment
      const adjustment = await tx.stockAdjustment.create({
        data: {
          productId,
          locationId,
          countedQty: countedNum,
          previousQty,
          difference,
          reason: reason || 'Physical inventory count adjustment',
          createdBy: userId,
        },
        include: {
          product: true,
          location: true,
          creator: true,
        },
      });

      // 3. Record in stock_moves ledger
      await tx.stockMove.create({
        data: {
          productId,
          locationId,
          quantityChange: difference,
          moveType: 'ADJUSTMENT',
          referenceId: adjustment.id,
          referenceType: 'stock_adjustment',
          createdBy: userId,
        },
      });

      return adjustment;
    });

    return NextResponse.json({
      adjustment: {
        ...result,
        countedQty: Number(result.countedQty),
        previousQty: Number(result.previousQty),
        difference: Number(result.difference),
      },
      message: 'Stock adjusted successfully',
    });
  } catch (error) {
    console.error('Adjustment POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
