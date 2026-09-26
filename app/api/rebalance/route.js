import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      stockLevels: { include: { location: { select: { id: true, name: true, code: true } } } },
    },
  });

  const moves = [];
  for (const product of products) {
    const levels = product.stockLevels.map((level) => ({
      locationId: level.location.id,
      location: level.location.name,
      quantity: Number(level.quantity),
    }));
    const shortages = levels.filter((level) => level.quantity <= Math.max(2, Number(product.reorderPoint) * 0.25));
    const donors = levels.filter((level) => level.quantity >= 8).sort((a, b) => b.quantity - a.quantity);
    for (const shortage of shortages) {
      const donor = donors.find((level) => level.locationId !== shortage.locationId && level.quantity >= 8);
      if (!donor) continue;
      const quantity = Math.min(5, Math.floor(donor.quantity / 2));
      if (quantity <= 0) continue;
      moves.push({
        productId: product.id,
        product: product.name,
        sku: product.sku,
        uom: product.uom,
        fromId: donor.locationId,
        from: donor.location,
        toId: shortage.locationId,
        to: shortage.location,
        quantity,
        reason: `${shortage.location} is empty while ${donor.location} has ${donor.quantity}`,
      });
    }
  }

  return NextResponse.json({ moves: moves.slice(0, 12), count: moves.length });
}

export async function POST(request) {
  const { getUserFromHeaders } = await import('@/lib/session');
  const { id: userId } = getUserFromHeaders(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const move = await request.json();
  if (!move.productId || !move.fromId || !move.toId || !move.quantity) {
    return NextResponse.json({ error: 'Incomplete rebalance move' }, { status: 400 });
  }

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const transfer = await prisma.internalTransfer.create({
    data: {
      reference: `RBL-${date}-${Math.floor(1000 + Math.random() * 9000)}`,
      sourceLocationId: move.fromId,
      destLocationId: move.toId,
      status: 'READY',
      createdBy: userId,
      lines: { create: [{ productId: move.productId, quantity: move.quantity }] },
    },
  });
  return NextResponse.json({ transfer }, { status: 201 });
}
