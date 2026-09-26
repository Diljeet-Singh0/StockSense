import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { receipts: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Suppliers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, email, phone, address } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
      },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error('Suppliers POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, name, email, phone, address } = await request.json();
    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: 'Supplier ID and name are required' }, { status: 400 });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
      },
    });

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error('Suppliers PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    // Check if supplier has receipts
    const receiptsCount = await prisma.receipt.count({ where: { supplierId: id } });
    if (receiptsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete supplier with ${receiptsCount} associated receipt(s).` },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Suppliers DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
