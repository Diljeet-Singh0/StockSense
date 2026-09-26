import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { imageForProduct } from '@/lib/product-images';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const operation = searchParams.get('operation') || '';
    const status = searchParams.get('status') || '';
    const productWhere = categoryId ? { categoryId } : {};
    const stockWhere = locationId ? { locationId } : {};
    const documentStatus = status ? { status } : { status: { in: ['DRAFT', 'WAITING', 'READY'] } };
    const filterLocation = locationId ? { locationId } : {};

    const [
      inventoryProducts,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers,
      pendingCustomerOrders,
      recentMoves,
      pendingStoreOrders,
      locationsSummary,
      valuationResult,
      categories,
    ] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        select: {
          id: true,
          name: true,
          sku: true,
          uom: true,
          price: true,
          reorderPoint: true,
          stockLevels: {
            where: stockWhere,
            select: { quantity: true, locationId: true },
          },
        },
      }),
      operation && operation !== 'RECEIPT'
        ? Promise.resolve(0)
        : prisma.receipt.count({ where: { ...documentStatus, ...filterLocation } }),
      operation && operation !== 'DELIVERY'
        ? Promise.resolve(0)
        : prisma.deliveryOrder.count({ where: { ...documentStatus, ...filterLocation } }),
      operation && operation !== 'TRANSFER'
        ? Promise.resolve(0)
        : prisma.internalTransfer.count({
        where: {
          ...documentStatus,
          ...(locationId ? { OR: [{ sourceLocationId: locationId }, { destLocationId: locationId }] } : {}),
        },
      }),
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
      prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);

    const productHealth = inventoryProducts.map((product) => {
      const totalStock = product.stockLevels.reduce((sum, level) => sum + Number(level.quantity), 0);
      const reorderPoint = Number(product.reorderPoint);
      return { ...product, totalStock, reorderPoint };
    });
    const totalProducts = productHealth.length;
    const totalProductsInStock = productHealth.filter((product) => product.totalStock > 0).length;
    const lowStockCount = productHealth.filter(
      (product) => product.totalStock > 0 && product.reorderPoint > 0 && product.totalStock <= product.reorderPoint
    ).length;
    const outOfStockCount = productHealth.filter((product) => product.totalStock <= 0).length;

    // Process urgent low stock items
    const lowStockList = productHealth
      .filter((product) => product.reorderPoint > 0 && product.totalStock <= product.reorderPoint)
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        uom: product.uom,
        price: Number(product.price),
        totalStock: product.totalStock,
        reorderPoint: product.reorderPoint,
        deficit: Math.max(0, product.reorderPoint - product.totalStock),
        imageUrl: imageForProduct(product.name),
      }))
      .sort((a, b) => a.totalStock - b.totalStock);

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
        totalProductsInStock,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
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
      categories,
      filters: { locationId, categoryId, operation, status },
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
