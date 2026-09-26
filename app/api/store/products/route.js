import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { imageForProduct } from '@/lib/product-images';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where = {
      isVisibleOnStore: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          stockLevels: {
            select: { quantity: true, locationId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    const formatted = products.map((p) => {
      const totalStock = p.stockLevels.reduce((sum, sl) => sum + Number(sl.quantity), 0);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        uom: p.uom,
        price: Number(p.price),
        imageUrl: imageForProduct(p.name),
        description: p.description,
        category: p.category,
        totalStock,
        inStock: totalStock > 0,
      };
    });

    return NextResponse.json({
      products: formatted,
      categories,
    });
  } catch (error) {
    console.error('Storefront products error:', error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}
