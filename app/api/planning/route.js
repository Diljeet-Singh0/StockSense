import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { planLine } from '@/lib/planning';

async function loadContext() {
  const [products, transfers, receipts] = await Promise.all([
    prisma.product.findMany({
      include: { stockLevels: { include: { location: { select: { id: true, name: true, code: true, storageType: true } } } } },
    }),
    prisma.transferLine.findMany({
      where: { transfer: { status: { in: ['DRAFT', 'READY'] } } },
      include: { transfer: { select: { sourceLocationId: true, destLocationId: true, status: true } } },
    }),
    prisma.receiptLine.findMany({
      where: { receipt: { status: { in: ['DRAFT', 'READY'] } } },
      include: { receipt: { select: { locationId: true, status: true } } },
    }),
  ]);
  return {
    products,
    openTransfers: transfers.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
      sourceLocationId: line.transfer.sourceLocationId,
      destLocationId: line.transfer.destLocationId,
      status: line.transfer.status,
    })),
    openReceipts: receipts.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
      locationId: line.receipt.locationId,
      status: line.receipt.status,
    })),
  };
}

function build(context, assumptions = {}) {
  const plans = context.products.map((product) => planLine({
    product: {
      ...product,
      dailyDemand: Number(product.dailyDemand),
      reorderPoint: Number(product.reorderPoint),
      price: Number(product.price),
      costPrice: product.costPrice == null ? null : Number(product.costPrice),
    },
    levels: product.stockLevels.map((level) => ({
      locationId: level.location.id,
      location: level.location.name,
      storageType: level.location.storageType,
      quantity: Number(level.quantity),
    })),
    openTransfers: context.openTransfers,
    openReceipts: context.openReceipts,
    ...assumptions,
  })).filter((plan) => plan.actions.length || plan.blocked.length);
  const actions = plans.flatMap((plan) => plan.actions);
  return {
    generatedAt: new Date().toISOString(),
    assumptions,
    label: assumptions.simulated ? 'Simulated scenario. Live stock was not changed.' : 'Current plan',
    summary: {
      transfers: actions.filter((item) => item.action === 'TRANSFER').length,
      buys: actions.filter((item) => item.action === 'BUY').length,
      blocked: plans.reduce((sum, plan) => sum + plan.blocked.length, 0),
    },
    plans,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const context = await loadContext();
  const current = build(context, { simulated: false });
  const demandUp = Number(searchParams.get('demandUp') || 0);
  const lateDays = Number(searchParams.get('lateDays') || 0);
  const unavailable = searchParams.get('unavailable') || '';
  if (!demandUp && !lateDays && !unavailable) return NextResponse.json(current);
  const simulated = build(context, {
    simulated: true,
    demandMultiplier: 1 + demandUp / 100,
    leadTimeExtra: lateDays,
    unavailableLocationIds: unavailable ? unavailable.split(',') : [],
  });
  return NextResponse.json({ current, simulated });
}
