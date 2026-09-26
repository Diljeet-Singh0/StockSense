import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

function statusFor(batch) {
  if (batch.status === 'QUARANTINE') return 'QUARANTINE';
  const days = Math.ceil((new Date(batch.expiresAt).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'EXPIRED';
  if (days <= 3) return 'EXPIRING';
  return 'AVAILABLE';
}

export async function GET(request) {
  const productId = new URL(request.url).searchParams.get('productId');
  const batches = await prisma.stockBatch.findMany({
    where: productId ? { productId } : {},
    include: { product: { select: { name: true, sku: true, price: true } }, location: { select: { name: true, code: true } } },
    orderBy: { expiresAt: 'asc' },
  });
  const items = batches.map((batch) => {
    const daysLeft = Math.ceil((new Date(batch.expiresAt).getTime() - Date.now()) / 86400000);
    return {
      id: batch.id,
      lotCode: batch.lotCode,
      product: batch.product.name,
      sku: batch.product.sku,
      location: batch.location.name,
      quantity: Number(batch.quantity),
      expiresAt: batch.expiresAt,
      daysLeft,
      status: statusFor(batch),
      valueAtSellingPrice: Number(batch.quantity) * Number(batch.product.price),
    };
  });
  const expiring = items.filter((item) => item.status === 'EXPIRING' || item.status === 'EXPIRED');
  return NextResponse.json({
    items,
    summary: {
      expiringPacks: expiring.reduce((sum, item) => sum + item.quantity, 0),
      sellingValueAtRisk: expiring.reduce((sum, item) => sum + item.valueAtSellingPrice, 0),
      note: 'Selling value at risk is not measured waste saved.',
    },
    fefo: items.filter((item) => item.status !== 'QUARANTINE' && item.status !== 'EXPIRED' && item.quantity > 0).slice(0, 8),
  });
}

export async function POST(request) {
  const { id: userId, role } = getUserFromHeaders(request);
  if (!userId || (role !== 'MANAGER' && role !== 'STAFF')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (!body.productId || !body.locationId || !body.lotCode || !body.expiresAt || !body.quantity) {
    return NextResponse.json({ error: 'Product, location, lot, expiry, and quantity are required' }, { status: 400 });
  }
  const batch = await prisma.stockBatch.upsert({
    where: { productId_locationId_lotCode: { productId: body.productId, locationId: body.locationId, lotCode: body.lotCode } },
    update: { quantity: { increment: body.quantity }, expiresAt: new Date(body.expiresAt), status: 'AVAILABLE' },
    create: {
      productId: body.productId,
      locationId: body.locationId,
      lotCode: body.lotCode,
      quantity: body.quantity,
      expiresAt: new Date(body.expiresAt),
    },
  });
  return NextResponse.json({ batch }, { status: 201 });
}
