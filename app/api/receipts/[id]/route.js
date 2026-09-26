import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        supplier: true,
        location: true,
        creator: { select: { id: true, name: true, email: true } },
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

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({
      receipt: {
        ...receipt,
        lines: receipt.lines.map((l) => ({
          ...l,
          quantity: Number(l.quantity),
        })),
      },
    });
  } catch (error) {
    console.error('Receipt GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status, notes } = await request.json();

    const existing = await prisma.receipt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    if (existing.status === 'DONE') {
      return NextResponse.json({ error: 'Cannot modify a validated receipt' }, { status: 400 });
    }

    const updated = await prisma.receipt.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ receipt: updated });
  } catch (error) {
    console.error('Receipt PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
