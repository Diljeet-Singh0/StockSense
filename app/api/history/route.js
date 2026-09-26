import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const locationId = searchParams.get('locationId');
    const moveType = searchParams.get('moveType');
    const search = searchParams.get('search');

    const where = {};
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;
    if (moveType) where.moveType = moveType;
    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { location: { name: { contains: search, mode: 'insensitive' } } },
        { referenceType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const moves = await prisma.stockMove.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, uom: true } },
        location: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      moves: moves.map((m) => ({
        ...m,
        quantityChange: Number(m.quantityChange),
      })),
    });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
