import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const locationId = searchParams.get('locationId');
    const search = searchParams.get('search');

    const where = {};
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        location: { select: { id: true, name: true, code: true } },
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
      receipts: receipts.map((r) => ({
        ...r,
        lines: r.lines.map((l) => ({ ...l, quantity: Number(l.quantity) })),
      })),
    });
  } catch (error) {
    console.error('Receipts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id: userId } = getUserFromHeaders(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { supplierId, locationId, notes, lines } = body;

    if (!locationId) {
      return NextResponse.json({ error: 'Destination location is required' }, { status: 400 });
    }
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'At least one product line is required' }, { status: 400 });
    }

    // Generate unique reference e.g. REC-20260926-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const reference = `REC-${dateStr}-${randSuffix}`;

    const receipt = await prisma.receipt.create({
      data: {
        reference,
        supplierId: supplierId || null,
        locationId,
        notes: notes || null,
        status: 'READY',
        createdBy: userId,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            uom: line.uom || 'pcs',
          })),
        },
      },
      include: {
        supplier: true,
        location: true,
        lines: { include: { product: true } },
      },
    });

    return NextResponse.json({ receipt }, { status: 201 });
  } catch (error) {
    console.error('Receipts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
