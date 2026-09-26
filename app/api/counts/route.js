import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function GET() {
  const tasks = await prisma.countTask.findMany({
    include: { product: { select: { name: true, sku: true } }, location: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 40,
  });
  return NextResponse.json({
    tasks: tasks.map((task) => ({
      ...task,
      systemQty: Number(task.systemQty),
      countedQty: task.countedQty == null ? null : Number(task.countedQty),
      product: task.product.name,
      sku: task.product.sku,
      location: task.location.name,
    })),
  });
}

export async function POST(request) {
  const { id: userId, role } = getUserFromHeaders(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();

  if (body.action === 'generate') {
    const products = await prisma.product.findMany({ include: { stockLevels: { include: { location: true } } }, take: 80 });
    const valued = products.map((product) => ({
      product,
      value: product.stockLevels.reduce((sum, level) => sum + Number(level.quantity) * Number(product.price), 0),
    })).sort((a, b) => b.value - a.value);
    const top = valued.slice(0, 5);
    const created = [];
    for (const item of top) {
      const level = item.product.stockLevels.sort((a, b) => Number(b.quantity) - Number(a.quantity))[0];
      if (!level) continue;
      const existing = await prisma.countTask.findFirst({ where: { productId: item.product.id, locationId: level.locationId, status: { in: ['OPEN', 'SUBMITTED'] } } });
      if (existing) continue;
      created.push(await prisma.countTask.create({
        data: {
          reference: `CNT-${Date.now().toString().slice(-6)}-${created.length}`,
          productId: item.product.id,
          locationId: level.locationId,
          systemQty: level.quantity,
          priority: 'A',
          blind: true,
          assignedTo: userId,
        },
      }));
    }
    return NextResponse.json({ created: created.length }, { status: 201 });
  }

  if (!body.productId || !body.locationId) return NextResponse.json({ error: 'Product and location are required' }, { status: 400 });
  const level = await prisma.stockLevel.findUnique({ where: { productId_locationId: { productId: body.productId, locationId: body.locationId } } });
  const task = await prisma.countTask.create({
    data: {
      reference: `CNT-${Date.now().toString().slice(-8)}`,
      productId: body.productId,
      locationId: body.locationId,
      systemQty: level?.quantity || 0,
      blind: body.blind !== false,
      priority: body.priority || 'B',
      assignedTo: userId,
    },
  });
  return NextResponse.json({ task }, { status: 201 });
}
