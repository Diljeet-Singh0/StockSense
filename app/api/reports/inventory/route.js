import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId') || '';
  const products = await prisma.product.findMany({
    include: {
      category: { select: { name: true } },
      stockLevels: {
        where: locationId ? { locationId } : {},
        include: { location: { select: { name: true, code: true } } },
      },
    },
    orderBy: { name: 'asc' },
  });

  const rows = [['Product', 'SKU', 'Category', 'Location', 'On hand', 'UOM', 'Reorder point', 'Status', 'Value INR']];
  for (const product of products) {
    const levels = product.stockLevels.length ? product.stockLevels : [{ quantity: 0, location: { name: 'Unassigned', code: '-' } }];
    for (const level of levels) {
      const qty = Number(level.quantity);
      const reorder = Number(product.reorderPoint);
      const status = qty <= 0 ? 'Out of stock' : reorder > 0 && qty <= reorder ? 'Low stock' : 'In stock';
      rows.push([
        product.name,
        product.sku,
        product.category?.name || 'Uncategorized',
        `${level.location.name} (${level.location.code})`,
        qty,
        product.uom,
        reorder,
        status,
        (qty * Number(product.price)).toFixed(2),
      ]);
    }
  }

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="stocksense-inventory-report.csv"',
    },
  });
}
