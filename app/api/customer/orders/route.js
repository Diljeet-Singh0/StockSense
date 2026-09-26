import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromHeaders } from '@/lib/session';

export async function GET(request) {
  try {
    const { id: customerId } = getUserFromHeaders(request);
    if (!customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.customerOrder.findMany({
      where: { customerId },
      include: {
        lines: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, imageUrl: true, uom: true },
            },
          },
        },
        deliveryOrder: {
          select: { id: true, reference: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      paymentMethod: o.paymentMethod,
      shippingAddress: o.shippingAddress,
      customerPhone: o.customerPhone,
      createdAt: o.createdAt,
      deliveryStatus: o.deliveryOrder?.status || 'PENDING',
      lines: o.lines.map((l) => ({
        id: l.id,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        total: Number(l.total),
        product: l.product,
      })),
    }));

    return NextResponse.json({ orders: formatted });
  } catch (error) {
    console.error('Customer orders GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve orders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id: customerId } = getUserFromHeaders(request);
    if (!customerId) {
      return NextResponse.json({ error: 'Please log in to place an order' }, { status: 401 });
    }

    const body = await request.json();
    const { items, shippingAddress, phone, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.pincode) {
      return NextResponse.json({ error: 'Complete shipping address is required' }, { status: 400 });
    }

    // Default fulfillment warehouse (Main Warehouse / Fulfillment Hub)
    const fulfillmentHub = await prisma.location.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!fulfillmentHub) {
      return NextResponse.json({ error: 'No active fulfillment warehouse found' }, { status: 500 });
    }

    // 1. Verify stock availability for all items before starting transaction
    const insufficientStockErrors = [];
    const validatedProducts = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          stockLevels: {
            where: { locationId: fulfillmentHub.id },
          },
        },
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
      }

      const availableQty = product.stockLevels[0] ? Number(product.stockLevels[0].quantity) : 0;
      const requestedQty = Number(item.quantity);

      if (availableQty < requestedQty) {
        insufficientStockErrors.push({
          productName: product.name,
          sku: product.sku,
          available: availableQty,
          requested: requestedQty,
        });
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * requestedQty;
      calculatedTotal += lineTotal;

      validatedProducts.push({
        product,
        quantity: requestedQty,
        unitPrice,
        lineTotal,
      });
    }

    if (insufficientStockErrors.length > 0) {
      const details = insufficientStockErrors
        .map((e) => `${e.productName}: only ${e.available} units available in warehouse (requested ${e.requested})`)
        .join(', ');
      return NextResponse.json(
        { error: `Insufficient warehouse stock: ${details}`, items: insufficientStockErrors },
        { status: 400 }
      );
    }

    // Generate unique order number (e.g. ORD-202609-XXXX)
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `ORD-${dateStr}-${randCode}`;

    // 2. CRITICAL TRANSACTION: CustomerOrder + DeliveryOrder + Stock Reduction + StockMove Ledger
    const result = await prisma.$transaction(async (tx) => {
      // Step A: Create CustomerOrder
      const order = await tx.customerOrder.create({
        data: {
          orderNumber,
          customerId,
          status: 'PLACED',
          totalAmount: calculatedTotal,
          paymentMethod: 'COD',
          shippingAddress: {
            name: shippingAddress.name || 'Customer',
            phone: phone || shippingAddress.phone || '',
            line1: shippingAddress.line1,
            line2: shippingAddress.line2 || '',
            city: shippingAddress.city,
            state: shippingAddress.state || '',
            pincode: shippingAddress.pincode,
          },
          customerPhone: phone || shippingAddress.phone || null,
          notes: notes || null,
          lines: {
            create: validatedProducts.map((p) => ({
              productId: p.product.id,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              total: p.lineTotal,
            })),
          },
        },
        include: {
          lines: { include: { product: true } },
        },
      });

      // Step B: Auto-create DeliveryOrder in Inventory System
      const deliveryOrder = await tx.deliveryOrder.create({
        data: {
          reference: `DEL-${orderNumber}`,
          customerName: `${shippingAddress.name || 'Customer'} (COD #${orderNumber})`,
          locationId: fulfillmentHub.id,
          status: 'READY',
          source: 'CUSTOMER_ORDER',
          customerOrderId: order.id,
          notes: `Auto-generated from storefront COD order ${orderNumber}. Address: ${shippingAddress.line1}, ${shippingAddress.city} - ${shippingAddress.pincode}. Phone: ${phone || ''}`,
          createdBy: customerId,
          lines: {
            create: validatedProducts.map((p) => ({
              productId: p.product.id,
              quantity: p.quantity,
            })),
          },
        },
      });

      // Step C: Deduct stock from fulfillment warehouse & append to immutable stock_moves ledger
      for (const item of validatedProducts) {
        await tx.stockLevel.update({
          where: {
            productId_locationId: {
              productId: item.product.id,
              locationId: fulfillmentHub.id,
            },
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        await tx.stockMove.create({
          data: {
            productId: item.product.id,
            locationId: fulfillmentHub.id,
            quantityChange: -item.quantity,
            moveType: 'DELIVERY',
            referenceId: order.id,
            referenceType: 'customer_order',
            createdBy: customerId,
          },
        });
      }

      return { order, deliveryOrder };
    });

    return NextResponse.json({
      success: true,
      order: {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        totalAmount: Number(result.order.totalAmount),
        status: result.order.status,
      },
      message: 'Order placed successfully! Delivery order dispatched to warehouse.',
    }, { status: 201 });
  } catch (error) {
    console.error('Order placement transaction error:', error);
    return NextResponse.json({ error: 'Failed to place order. Transaction aborted.' }, { status: 500 });
  }
}
