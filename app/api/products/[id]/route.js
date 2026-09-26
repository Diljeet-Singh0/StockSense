import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        stockLevels: {
          include: { location: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        ...product,
        price: Number(product.price),
        imageUrl: product.imageUrl,
        isVisibleOnStore: product.isVisibleOnStore,
        reorderPoint: Number(product.reorderPoint),
        totalStock: product.stockLevels.reduce((sum, sl) => sum + Number(sl.quantity), 0),
        stockLevels: product.stockLevels.map(sl => ({
          ...sl,
          quantity: Number(sl.quantity),
        })),
      },
    });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, sku, categoryId, uom, reorderPoint, price, imageUrl, isVisibleOnStore, description } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sku && { sku }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(uom && { uom }),
        ...(reorderPoint !== undefined && { reorderPoint }),
        ...(price !== undefined && { price }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isVisibleOnStore !== undefined && { isVisibleOnStore }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }
    console.error('Product PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
