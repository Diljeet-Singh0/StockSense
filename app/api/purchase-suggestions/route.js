import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { imageForProduct } from '@/lib/product-images';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId') || '';
    const categoryId = searchParams.get('categoryId') || '';

    const products = await prisma.product.findMany({
      where: categoryId ? { categoryId } : {},
      include: {
        category: { select: { id: true, name: true } },
        stockLevels: {
          where: locationId ? { locationId } : {},
          include: { location: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const suggestions = products
      .map((product) => {
        const onHand = product.stockLevels.reduce((sum, level) => sum + Number(level.quantity), 0);
        const reorderPoint = Number(product.reorderPoint);
        const target = Math.max(reorderPoint * 2, reorderPoint);
        const suggestedQty = Math.max(0, target - onHand);
        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          uom: product.uom,
          price: Number(product.price),
          imageUrl: imageForProduct(product.name),
          category: product.category,
          onHand,
          reorderPoint,
          suggestedQty,
          estimatedCost: suggestedQty * Number(product.price),
          urgency: onHand <= 0 ? 'OUT' : 'LOW',
          locations: product.stockLevels.map((level) => ({
            id: level.location.id,
            name: level.location.name,
            quantity: Number(level.quantity),
          })),
        };
      })
      .filter((item) => item.reorderPoint > 0 && item.onHand <= item.reorderPoint)
      .sort((a, b) => b.suggestedQty - a.suggestedQty || a.onHand - b.onHand);

    return NextResponse.json({
      suggestions,
      summary: {
        items: suggestions.length,
        units: suggestions.reduce((sum, item) => sum + item.suggestedQty, 0),
        estimatedCost: suggestions.reduce((sum, item) => sum + item.estimatedCost, 0),
      },
    });
  } catch (error) {
    console.error('Purchase suggestions error:', error);
    return NextResponse.json({ error: 'Failed to build purchase suggestions' }, { status: 500 });
  }
}
