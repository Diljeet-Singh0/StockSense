import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function GET(request) {
  try {
    const { id: userId } = getUserFromHeaders(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Customer addresses GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id: userId } = getUserFromHeaders(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { line1, line2, city, state, pincode, isDefault } = await request.json();

    if (!line1 || !city || !pincode) {
      return NextResponse.json({ error: 'Address line, city, and pincode are required' }, { status: 400 });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        line1,
        line2: line2 || null,
        city,
        state: state || '',
        pincode,
        isDefault: !!isDefault,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error('Customer address create error:', error);
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}
