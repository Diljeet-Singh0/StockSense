import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { imageForProduct } from '@/lib/product-images';

export async function GET() {
  try {
    const [
      totalProducts,
      lowStockCountResult,
      outOfStockCountResult,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers,
      pendingCustomerOrders,
      recentMoves,
      urgentLowStockProducts,
      pendingStoreOrders,
      locationsSummary,
      valuationResult,
    ] = await Promise.all([
      prisma.product.count(),
      // Low stock count
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT p.id)::int as count
        FROM products p
        JOIN stock_levels sl ON sl.product_id = p.id
        WHERE p.reorder_point > 0 AND sl.quantity <= p.reorder_point AND sl.quantity > 0
      `,
      // Out of stock count
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT p.id)::int as count
        FROM products p
        LEFT JOIN stock_levels sl ON sl.product_id = p.id
        GROUP BY p.id
        HAVING COALESCE(SUM(sl.quantity), 0) = 0
      `,
      prisma.receipt.count({ where: { status: { in: ['DRAFT', 'WAITING', 'READY'] } } }),
      prisma.deliveryOrder.count({ where: { status: { in: ['DRAFT', 'WAITING', 'READY'] } } }),
      prisma.internalTransfer.count({ where: { status: { in: ['DRAFT', 'WAITING', 'READY'] } } }),
      prisma.customerOrder.count({ where: { status: { in: ['PLACED', 'CONFIRMED', 'OUT_FOR_DELIVERY'] } } }),
      prisma.stockMove.findMany({
        take: 12,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          location: { select: { name: true } },
          creator: { select: { name: true } },
        },
      }),
      // Urgent products list: Products with low or 0 stock
      prisma.product.findMany({
        where: {
          reorderPoint: { gt: 0 },
        },
        include: {
          stockLevels: {
            include: { location: { select: { name: true } } },
          },
        },
        take: 30,
      }),
      // Pending store customer orders needing warehouse fulfillment
      prisma.customerOrder.findMany({
        where: { status: { in: ['PLACED', 'CONFIRMED', 'OUT_FOR_DELIVERY'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          lines: {
            include: { product: { select: { name: true, sku: true } } },
          },
          deliveryOrder: { select: { id: true, reference: true, status: true } },
        },
      }),
      // Locations with item counts
      prisma.location.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          _count: { select: { stockLevels: true } },
          stockLevels: { select: { quantity: true } },
        },
      }),
      // Total valuation: sum of (sl.quantity * p.price)
      prisma.$queryRaw`
        SELECT COALESCE(SUM(sl.quantity * p.price), 0)::numeric as valuation
        FROM stock_levels sl
        JOIN products p ON p.id = sl.product_id
      `,
    ]);

    // Process urgent low stock items
    const lowStockList = [];
    for (const prod of urgentLowStockProducts) {
      const totalStock = prod.stockLevels.reduce((sum, sl) => sum + Number(sl.quantity), 0);
      const reorder = Number(prod.reorderPoint);
      if (totalStock <= reorder) {
        lowStockList.push({
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          uom: prod.uom,
          price: Number(prod.price),
          totalStock,
          reorderPoint: reorder,
          deficit: Math.max(0, reorder - totalStock),
          imageUrl: imageForProduct(prod.name),
        });
      }
    }
    lowStockList.sort((a, b) => a.totalStock - b.totalStock);

    // Locations summary
    const locationsWithUnits = locationsSummary.map((loc) => {
      const totalUnits = loc.stockLevels.reduce((acc, sl) => acc + Number(sl.quantity), 0);
      return {
        id: loc.id,
        name: loc.name,
        code: loc.code,
        itemCount: loc._count.stockLevels,
        totalUnits,
      };
    });

    const totalValuation = Number(valuationResult[0]?.valuation || 0);

    return NextResponse.json({
      kpis: {
        totalProducts,
        lowStock: lowStockCountResult[0]?.count || 0,
        outOfStock: outOfStockCountResult.length || 0,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers,
        pendingCustomerOrders,
        totalValuation,
      },
      lowStockList: lowStockList.slice(0, 8),
      pendingOrders: pendingStoreOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt,
        customerName: o.customer?.name || 'Customer',
        customerPhone: o.customer?.phone || o.customerPhone || '',
        itemCount: o.lines.length,
        deliveryOrderId: o.deliveryOrder?.id || null,
        deliveryRef: o.deliveryOrder?.reference || null,
      })),
      locations: locationsWithUnits,
      recentMoves: recentMoves.map((m) => ({
        ...m,
        quantityChange: m.quantityChange.toString(),
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
