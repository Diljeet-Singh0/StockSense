import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { sourceLocation: { name: { contains: search, mode: 'insensitive' } } },
        { destLocation: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const transfers = await prisma.internalTransfer.findMany({
      where,
      include: {
        sourceLocation: { select: { id: true, name: true, code: true } },
        destLocation: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true, uom: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      transfers: transfers.map((t) => ({
        ...t,
        lines: t.lines.map((l) => ({ ...l, quantity: Number(l.quantity) })),
      })),
    });
  } catch (error) {
    console.error('Transfers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id: userId } = getUserFromHeaders(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { sourceLocationId, destLocationId, lines } = body;

    if (!sourceLocationId || !destLocationId) {
      return NextResponse.json({ error: 'Source and destination locations are required' }, { status: 400 });
    }

    if (sourceLocationId === destLocationId) {
      return NextResponse.json({ error: 'Source and destination locations must be different' }, { status: 400 });
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'At least one product line is required' }, { status: 400 });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const reference = `TRN-${dateStr}-${randSuffix}`;

    const transfer = await prisma.internalTransfer.create({
      data: {
        reference,
        sourceLocationId,
        destLocationId,
        status: 'READY',
        createdBy: userId,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
        },
      },
      include: {
        sourceLocation: true,
        destLocation: true,
        lines: { include: { product: true } },
      },
    });

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (error) {
    console.error('Transfers POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
