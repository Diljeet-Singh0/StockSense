import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const filter = searchParams.get('filter') || '';

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        stockLevels: {
          include: { location: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute total stock and apply low/out filters
    let result = products.map(p => {
      const totalStock = p.stockLevels.reduce((sum, sl) => sum + Number(sl.quantity), 0);
      return {
        ...p,
        price: Number(p.price),
        imageUrl: p.imageUrl,
        isVisibleOnStore: p.isVisibleOnStore,
        totalStock,
        reorderPoint: Number(p.reorderPoint),
        stockLevels: p.stockLevels.map(sl => ({
          ...sl,
          quantity: Number(sl.quantity),
        })),
      };
    });

    if (filter === 'low') {
      result = result.filter(p => p.reorderPoint > 0 && p.totalStock <= p.reorderPoint && p.totalStock > 0);
    } else if (filter === 'out') {
      result = result.filter(p => p.totalStock === 0);
    }

    return NextResponse.json({ products: result });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id: userId } = getUserFromHeaders(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, sku, categoryId, uom, reorderPoint, price, imageUrl, isVisibleOnStore, description, initialStock, locationId } = body;

    if (!name || !sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }

    // Create product, optionally with initial stock
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name,
          sku,
          categoryId: categoryId || null,
          uom: uom || 'pcs',
          reorderPoint: reorderPoint || 0,
          price: price !== undefined ? price : 0,
          imageUrl: imageUrl || null,
          isVisibleOnStore: isVisibleOnStore !== undefined ? isVisibleOnStore : true,
          description: description || null,
        },
      });

      if (initialStock && initialStock > 0 && locationId) {
        await tx.stockLevel.create({
          data: { productId: p.id, locationId, quantity: initialStock },
        });

        await tx.stockMove.create({
          data: {
            productId: p.id,
            locationId,
            quantityChange: initialStock,
            moveType: 'ADJUSTMENT',
            referenceId: p.id,
            referenceType: 'initial_stock',
            createdBy: userId,
          },
        });
      }

      return p;
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
