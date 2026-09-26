import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const delivery = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        location: true,
        creator: { select: { id: true, name: true, email: true } },
        customerOrder: {
          include: {
            customer: { select: { name: true, email: true, phone: true } },
          },
        },
        lines: {
          include: {
            product: {
              include: {
                stockLevels: true,
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery order not found' }, { status: 404 });
    }

    return NextResponse.json({
      delivery: {
        ...delivery,
        lines: delivery.lines.map((l) => ({
          ...l,
          quantity: Number(l.quantity),
        })),
      },
    });
  } catch (error) {
    console.error('Delivery GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id: userId } = getUserFromHeaders(request);
    const { id } = await params;
    const { status, notes, customerOrderStatus } = await request.json();

    const existing = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        customerOrder: true,
        lines: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Delivery order not found' }, { status: 404 });
    }

    // Cancellation flow with stock restoration
    if (status === 'CANCELED' && existing.status !== 'CANCELED') {
      const updated = await prisma.$transaction(async (tx) => {
        const d = await tx.deliveryOrder.update({
          where: { id },
          data: { status: 'CANCELED', notes: notes !== undefined ? notes : existing.notes },
        });

        if (existing.customerOrderId) {
          await tx.customerOrder.update({
            where: { id: existing.customerOrderId },
            data: { status: 'CANCELED' },
          });

          // Restore stock for customer order items
          for (const line of existing.lines) {
            const qty = Number(line.quantity);

            await tx.stockLevel.upsert({
              where: {
                productId_locationId: {
                  productId: line.productId,
                  locationId: existing.locationId,
                },
              },
              update: {
                quantity: { increment: qty },
              },
              create: {
                productId: line.productId,
                locationId: existing.locationId,
                quantity: qty,
              },
            });

            await tx.stockMove.create({
              data: {
                productId: line.productId,
                locationId: existing.locationId,
                quantityChange: qty,
                moveType: 'ADJUSTMENT',
                referenceId: id,
                referenceType: 'delivery_canceled_restock',
                createdBy: userId || existing.createdBy,
              },
            });
          }
        }

        return d;
      });

      return NextResponse.json({ delivery: updated, message: 'Delivery canceled and stock restored' });
    }

    // Status sync to customer order
    const updated = await prisma.$transaction(async (tx) => {
      const d = await tx.deliveryOrder.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
        },
      });

      if (existing.customerOrderId) {
        let newCustStatus = customerOrderStatus;
        if (!newCustStatus) {
          if (status === 'DONE') newCustStatus = 'DELIVERED';
          else if (status === 'READY') newCustStatus = 'CONFIRMED';
        }

        if (newCustStatus) {
          await tx.customerOrder.update({
            where: { id: existing.customerOrderId },
            data: { status: newCustStatus },
          });
        }
      }

      return d;
    });

    return NextResponse.json({ delivery: updated });
  } catch (error) {
    console.error('Delivery PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
