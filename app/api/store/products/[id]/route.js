import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { imageForProduct } from '@/lib/product-images';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        stockLevels: {
          select: { quantity: true, location: { select: { name: true } } },
        },
      },
    });

    if (!product || !product.isVisibleOnStore) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const totalStock = product.stockLevels.reduce((sum, sl) => sum + Number(sl.quantity), 0);

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        uom: product.uom,
        price: Number(product.price),
        imageUrl: imageForProduct(product.name),
        description: product.description,
        category: product.category,
        totalStock,
        inStock: totalStock > 0,
      },
    });
  } catch (error) {
    console.error('Store product detail error:', error);
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
  }
}
