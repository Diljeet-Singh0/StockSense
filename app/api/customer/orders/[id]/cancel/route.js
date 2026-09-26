import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function POST(request, { params }) {
  try {
    const { id: userId, role } = getUserFromHeaders(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const order = await prisma.customerOrder.findUnique({
      where: { id },
      include: {
        lines: true,
        deliveryOrder: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (role === 'CUSTOMER' && order.customerId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (order.status === 'DELIVERED') {
      return NextResponse.json({ error: 'Cannot cancel an order that has already been delivered' }, { status: 400 });
    }

    if (order.status === 'CANCELED') {
      return NextResponse.json({ error: 'Order is already canceled' }, { status: 400 });
    }

    // Default fulfillment warehouse
    const fulfillmentHub = await prisma.location.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const locationId = order.deliveryOrder?.locationId || fulfillmentHub?.id;

    // Transaction: Cancel order, cancel delivery order, restore stock, write ledger
    await prisma.$transaction(async (tx) => {
      // 1. Mark customer order as CANCELED
      await tx.customerOrder.update({
        where: { id },
        data: { status: 'CANCELED' },
      });

      // 2. Mark delivery order as CANCELED if it exists
      if (order.deliveryOrder) {
        await tx.deliveryOrder.update({
          where: { id: order.deliveryOrder.id },
          data: { status: 'CANCELED' },
        });
      }

      // 3. Restore stock & record stock moves
      if (locationId) {
        for (const line of order.lines) {
          const qty = Number(line.quantity);

          await tx.stockLevel.upsert({
            where: {
              productId_locationId: {
                productId: line.productId,
                locationId,
              },
            },
            update: {
              quantity: { increment: qty },
            },
            create: {
              productId: line.productId,
              locationId,
              quantity: qty,
            },
          });

          await tx.stockMove.create({
            data: {
              productId: line.productId,
              locationId,
              quantityChange: qty, // Positive return to stock
              moveType: 'ADJUSTMENT',
              referenceId: order.id,
              referenceType: 'order_canceled_restock',
              createdBy: userId,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Order canceled and stock restored to warehouse.' });
  } catch (error) {
    console.error('Cancel order error:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
