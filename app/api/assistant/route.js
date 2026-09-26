import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function POST(request) {
  const { id: userId } = getUserFromHeaders(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { question = '' } = await request.json();
  const q = question.toLowerCase();
  const now = new Date().toISOString();

  if (q.includes('expir')) {
    const batches = await prisma.stockBatch.findMany({
      where: { expiresAt: { lte: new Date(Date.now() + 7 * 86400000) }, quantity: { gt: 0 } },
      include: { product: true, location: true },
      orderBy: { expiresAt: 'asc' },
      take: 8,
    });
    return NextResponse.json({
      answer: batches.length ? `${batches.length} batches expire within 7 days.` : 'No batches expire in the next 7 days.',
      scope: 'All warehouses',
      range: 'Next 7 days',
      asOf: now,
      records: batches.map((batch) => `${batch.lotCode} · ${batch.product.name} · ${batch.location.name} · ${Number(batch.quantity)} · ${batch.expiresAt.toISOString().slice(0, 10)}`),
    });
  }

  if (q.includes('adjust')) {
    const since = new Date(Date.now() - 7 * 86400000);
    const moves = await prisma.stockMove.findMany({
      where: { moveType: 'ADJUSTMENT', quantityChange: { lt: 0 }, createdAt: { gte: since } },
      include: { product: true, location: true },
      take: 8,
    });
    return NextResponse.json({
      answer: `${moves.length} negative adjustments in the last 7 days.`,
      scope: 'All warehouses',
      range: 'Last 7 days',
      asOf: now,
      records: moves.map((move) => `${move.product.name} · ${move.location.name} · ${Number(move.quantityChange)}`),
    });
  }

  const products = await prisma.product.findMany({
    where: { reorderPoint: { gt: 0 } },
    include: { stockLevels: { include: { location: true } } },
    take: 80,
  });
  const low = products.flatMap((product) => product.stockLevels
    .filter((level) => Number(level.quantity) <= Number(product.reorderPoint))
    .map((level) => `${product.name} · ${level.location.name} · on hand ${Number(level.quantity)} · reorder ${Number(product.reorderPoint)}`));
  return NextResponse.json({
    answer: low.length ? `${low.length} location lines are at or below the reorder point. This uses the configured minimum-stock rule, not a demand forecast.` : 'No location is below its reorder point.',
    scope: 'All warehouses',
    range: 'Current snapshot',
    asOf: now,
    records: low.slice(0, 8),
  });
}
