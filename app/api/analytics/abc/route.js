import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const products = await prisma.product.findMany({
    include: { stockLevels: { select: { quantity: true } }, category: { select: { name: true } } },
  });
  const valued = products.map((product) => {
    const quantity = product.stockLevels.reduce((sum, level) => sum + Number(level.quantity), 0);
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || 'Uncategorized',
      quantity,
      value: quantity * Number(product.price),
    };
  }).filter((item) => item.value > 0).sort((a, b) => b.value - a.value);

  const total = valued.reduce((sum, item) => sum + item.value, 0) || 1;
  let running = 0;
  const items = valued.map((item) => {
    const before = running / total;
    running += item.value;
    const cumulative = running / total;
    const className = before < 0.8 ? 'A' : before < 0.95 ? 'B' : 'C';
    return { ...item, share: item.value / total, cumulative, className };
  });
  const classes = ['A', 'B', 'C'].map((name) => {
    const group = items.filter((item) => item.className === name);
    return { name, items: group.length, value: group.reduce((sum, item) => sum + item.value, 0) };
  });

  return NextResponse.json({ total, classes, items: items.slice(0, 15) });
}
