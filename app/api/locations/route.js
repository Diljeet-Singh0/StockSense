import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Locations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, code, parentId } = await request.json();
    if (!name || !code) return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });

    const location = await prisma.location.create({
      data: { name, code, parentId: parentId || null },
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Location code already exists' }, { status: 409 });
    }
    console.error('Locations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
