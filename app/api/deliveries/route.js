import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const locationId = searchParams.get('locationId');
    const search = searchParams.get('search');

    const source = searchParams.get('source');

    const where = {};
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const deliveries = await prisma.deliveryOrder.findMany({
      where,
      include: {
        location: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true } },
        customerOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            customerPhone: true,
          },
        },
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true, uom: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      deliveries: deliveries.map((d) => ({
        ...d,
        lines: d.lines.map((l) => ({ ...l, quantity: Number(l.quantity) })),
      })),
    });
  } catch (error) {
    console.error('Deliveries GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id: userId } = getUserFromHeaders(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { customerName, locationId, notes, lines } = body;

    if (!customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    if (!locationId) {
      return NextResponse.json({ error: 'Source location is required' }, { status: 400 });
    }
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'At least one product line is required' }, { status: 400 });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const reference = `DEL-${dateStr}-${randSuffix}`;

    const delivery = await prisma.deliveryOrder.create({
      data: {
        reference,
        customerName,
        locationId,
        notes: notes || null,
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
        location: true,
        lines: { include: { product: true } },
      },
    });

    return NextResponse.json({ delivery }, { status: 201 });
  } catch (error) {
    console.error('Deliveries POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
