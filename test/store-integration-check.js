import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runStoreIntegrationTest() {
  console.log('--- Running Customer Storefront -> Inventory Integration Test ---');

  try {
    // 1. Get or create a test customer
    let customer = await prisma.user.findFirst({ where: { email: 'test.customer@example.com' } });
    if (!customer) {
      customer = await prisma.user.create({
        data: {
          name: 'Integration Test Customer',
          email: 'test.customer@example.com',
          passwordHash: 'dummyhash',
          role: 'CUSTOMER',
          phone: '+91 9999988888',
        }
      });
    }

    // 2. Get active fulfillment warehouse
    const location = await prisma.location.findFirst({ where: { isActive: true } });
    if (!location) throw new Error('No active location found in DB');

    // 3. Create a test product with initial stock
    const testSku = `STORE-TEST-${Date.now()}`;
    const product = await prisma.product.create({
      data: {
        name: 'Store Test Organic Milk',
        sku: testSku,
        price: 65.50,
        uom: 'ltr',
        reorderPoint: 5,
        isVisibleOnStore: true,
        stockLevels: {
          create: {
            locationId: location.id,
            quantity: 50,
          }
        }
      }
    });

    console.log(`✓ Created test product: ${product.name} (${product.sku}) with 50 ltr at ${location.name}`);

    // Initial stock check
    let stock = await prisma.stockLevel.findUnique({
      where: { productId_locationId: { productId: product.id, locationId: location.id } }
    });
    if (Number(stock.quantity) !== 50) throw new Error(`Expected 50 units, got ${stock.quantity}`);

    // 4. Simulate Customer placing COD order for 5 units
    const orderQuantity = 5;
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-TEST-${randCode}`;

    const { customerOrder, deliveryOrder } = await prisma.$transaction(async (tx) => {
      // Step A: Create CustomerOrder
      const cOrder = await tx.customerOrder.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status: 'PLACED',
          totalAmount: 65.50 * orderQuantity,
          paymentMethod: 'COD',
          shippingAddress: {
            name: customer.name,
            phone: customer.phone,
            line1: '42 Warehouse Lane, Sector 5',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
          },
          customerPhone: customer.phone,
          lines: {
            create: [
              {
                productId: product.id,
                quantity: orderQuantity,
                unitPrice: 65.50,
                total: 65.50 * orderQuantity,
              }
            ]
          }
        },
        include: { lines: true }
      });

      // Step B: Auto-create DeliveryOrder in Inventory System
      const dOrder = await tx.deliveryOrder.create({
        data: {
          reference: `DEL-${orderNumber}`,
          customerName: `${customer.name} (COD #${orderNumber})`,
          locationId: location.id,
          status: 'READY',
          source: 'CUSTOMER_ORDER',
          customerOrderId: cOrder.id,
          notes: `Auto-generated from storefront COD order ${orderNumber}`,
          createdBy: customer.id,
          lines: {
            create: [
              {
                productId: product.id,
                quantity: orderQuantity,
              }
            ]
          }
        },
        include: { lines: true }
      });

      // Step C: Atomically decrease stock & record ledger
      await tx.stockLevel.update({
        where: { productId_locationId: { productId: product.id, locationId: location.id } },
        data: { quantity: { decrement: orderQuantity } }
      });

      await tx.stockMove.create({
        data: {
          productId: product.id,
          locationId: location.id,
          quantityChange: -orderQuantity,
          moveType: 'DELIVERY',
          referenceId: cOrder.id,
          referenceType: 'customer_order',
          createdBy: customer.id,
        }
      });

      return { customerOrder: cOrder, deliveryOrder: dOrder };
    });

    console.log(`✓ Step 1: Customer Order placed: ${customerOrder.orderNumber} (Total: ₹${customerOrder.totalAmount}, COD)`);
    console.log(`✓ Step 2: Auto-created Delivery Order: ${deliveryOrder.reference} (source: ${deliveryOrder.source}, location: ${location.name})`);

    // 5. Verify stock reduction
    stock = await prisma.stockLevel.findUnique({
      where: { productId_locationId: { productId: product.id, locationId: location.id } }
    });
    if (Number(stock.quantity) !== 45) {
      throw new Error(`Stock after order should be 45, got ${stock.quantity}`);
    }
    console.log(`✓ Step 3: Real-time stock reduced to ${stock.quantity} ltr (50 - 5 = 45)`);

    // 6. Verify ledger entry
    const ledgerEntry = await prisma.stockMove.findFirst({
      where: { referenceId: customerOrder.id },
      orderBy: { createdAt: 'desc' }
    });
    if (!ledgerEntry || Number(ledgerEntry.quantityChange) !== -5) {
      throw new Error('Ledger entry missing or incorrect quantityChange');
    }
    console.log(`✓ Step 4: Immutable audit ledger recorded movement of ${ledgerEntry.quantityChange} ltr (moveType: ${ledgerEntry.moveType})`);

    // 7. Test cancellation & stock restoration flow
    console.log('Testing cancellation & atomic stock restoration...');
    await prisma.$transaction(async (tx) => {
      // Mark customer order as CANCELED
      await tx.customerOrder.update({
        where: { id: customerOrder.id },
        data: { status: 'CANCELED' }
      });

      // Mark delivery order as CANCELED
      await tx.deliveryOrder.update({
        where: { id: deliveryOrder.id },
        data: { status: 'CANCELED' }
      });

      // Restore stock
      await tx.stockLevel.update({
        where: { productId_locationId: { productId: product.id, locationId: location.id } },
        data: { quantity: { increment: orderQuantity } }
      });

      // Record reverse ledger entry
      await tx.stockMove.create({
        data: {
          productId: product.id,
          locationId: location.id,
          quantityChange: orderQuantity,
          moveType: 'ADJUSTMENT',
          referenceId: customerOrder.id,
          referenceType: 'order_canceled_restock',
          createdBy: customer.id,
        }
      });
    });

    // Verify restored stock
    stock = await prisma.stockLevel.findUnique({
      where: { productId_locationId: { productId: product.id, locationId: location.id } }
    });
    if (Number(stock.quantity) !== 50) {
      throw new Error(`Stock after cancellation should be restored to 50, got ${stock.quantity}`);
    }
    console.log(`✓ Step 5: Order cancellation restored stock back to ${stock.quantity} ltr successfully!`);

    // Clean up test records
    await prisma.stockMove.deleteMany({ where: { productId: product.id } });
    await prisma.deliveryLine.deleteMany({ where: { deliveryId: deliveryOrder.id } });
    await prisma.deliveryOrder.delete({ where: { id: deliveryOrder.id } });
    await prisma.customerOrderLine.deleteMany({ where: { orderId: customerOrder.id } });
    await prisma.customerOrder.delete({ where: { id: customerOrder.id } });
    await prisma.stockLevel.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });

    console.log('\n🌟 ALL Customer Storefront -> Inventory Integration flows tested & verified successfully!');
  } catch (err) {
    console.error('❌ Store Integration Test Failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStoreIntegrationTest();
