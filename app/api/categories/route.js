import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, parentId } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const category = await prisma.category.create({
      data: { name, parentId: parentId || null },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    console.error('Categories POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
