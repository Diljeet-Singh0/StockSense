import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function PATCH(request, { params }) {
  const { id: userId, role } = getUserFromHeaders(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const task = await prisma.countTask.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: 'Count not found' }, { status: 404 });

  if (body.action === 'submit') {
    if (task.status !== 'OPEN') return NextResponse.json({ error: 'Count is not open' }, { status: 409 });
    const updated = await prisma.countTask.update({
      where: { id },
      data: { countedQty: body.countedQty, reason: body.reason || null, status: 'SUBMITTED', submittedAt: new Date() },
    });
    return NextResponse.json({ task: updated });
  }

  if (body.action === 'reject') {
    if (role !== 'MANAGER') return NextResponse.json({ error: 'Manager approval required' }, { status: 403 });
    const updated = await prisma.countTask.update({ where: { id }, data: { status: 'REJECTED', approvedBy: userId } });
    return NextResponse.json({ task: updated });
  }

  if (body.action !== 'post') return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  if (role !== 'MANAGER') return NextResponse.json({ error: 'Manager approval required' }, { status: 403 });
  if (task.status !== 'SUBMITTED' || task.countedQty == null) return NextResponse.json({ error: 'Count is not waiting for approval' }, { status: 409 });

  try {
    const posted = await prisma.$transaction(async (tx) => {
      const current = await tx.stockLevel.findUnique({ where: { productId_locationId: { productId: task.productId, locationId: task.locationId } } });
      const nowQty = Number(current?.quantity || 0);
      if (nowQty !== Number(task.systemQty)) {
        throw new Error(`Stock changed since the count snapshot (${task.systemQty} → ${nowQty}). Recount required.`);
      }
      const counted = Number(task.countedQty);
      const difference = counted - nowQty;
      if (current) {
        await tx.stockLevel.update({ where: { id: current.id }, data: { quantity: counted } });
      } else {
        await tx.stockLevel.create({ data: { productId: task.productId, locationId: task.locationId, quantity: counted } });
      }
      await tx.stockMove.create({
        data: {
          productId: task.productId,
          locationId: task.locationId,
          quantityChange: difference,
          moveType: 'ADJUSTMENT',
          referenceId: task.id,
          referenceType: 'count_task',
          createdBy: userId,
        },
      });
      await tx.stockAdjustment.create({
        data: {
          productId: task.productId,
          locationId: task.locationId,
          countedQty: counted,
          previousQty: nowQty,
          difference,
          reason: task.reason || 'Cycle count',
          createdBy: userId,
        },
      });
      return tx.countTask.update({ where: { id }, data: { status: 'POSTED', approvedBy: userId, postedAt: new Date() } });
    });
    return NextResponse.json({ task: posted });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
}
