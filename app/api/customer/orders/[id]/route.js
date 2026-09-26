import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function GET(request, { params }) {
  try {
    const { id: customerId, role } = getUserFromHeaders(request);
    if (!customerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const order = await prisma.customerOrder.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        deliveryOrder: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Ensure customers can only see their own orders (unless manager/staff)
    if (role === 'CUSTOMER' && order.customerId !== customerId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      order: {
        ...order,
        totalAmount: Number(order.totalAmount),
        lines: order.lines.map((l) => ({
          ...l,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          total: Number(l.total),
        })),
      },
    });
  } catch (error) {
    console.error('Customer order GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
