import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding StockSense v2.0 with complete, realistic operational dataset...');

  // ─── Clean existing data safely in foreign-key dependency order ────────────
  await prisma.customerOrderLine.deleteMany();
  await prisma.deliveryLine.deleteMany();
  await prisma.deliveryOrder.deleteMany();
  await prisma.customerOrder.deleteMany();
  await prisma.address.deleteMany();
  await prisma.stockMove.deleteMany();
  await prisma.stockAdjustment.deleteMany();
  await prisma.transferLine.deleteMany();
  await prisma.internalTransfer.deleteMany();
  await prisma.receiptLine.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  // ─── 1. Users & Accounts ───────────────────────────────────────────────────
  const adminHash = await bcryptjs.hash('admin123', 10);
  const custHash = await bcryptjs.hash('customer123', 10);

  const manager = await prisma.user.create({
    data: {
      name: 'Diljeet Singh (Store Manager)',
      email: 'admin@stocksense.com',
      phone: '+91 98100 10001',
      passwordHash: adminHash,
      role: 'MANAGER',
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Rohit Kumar (Warehouse Lead)',
      email: 'staff@stocksense.com',
      phone: '+91 98100 10002',
      passwordHash: adminHash,
      role: 'STAFF',
    },
  });

  const customerPriya = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'customer@example.com',
      phone: '+91 98765 43210',
      passwordHash: custHash,
      role: 'CUSTOMER',
    },
  });

  const customerRahul = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      phone: '+91 98234 56789',
      passwordHash: custHash,
      role: 'CUSTOMER',
    },
  });

  const customerAnanya = await prisma.user.create({
    data: {
      name: 'Ananya Patel',
      email: 'ananya.patel@example.com',
      phone: '+91 97112 33445',
      passwordHash: custHash,
      role: 'CUSTOMER',
    },
  });

  // Customer addresses
  await prisma.address.createMany({
    data: [
      {
        userId: customerPriya.id,
        line1: 'Flat 402, Sunshine Apartments, 5th Cross Road',
        line2: 'Near Indiranagar Metro Station',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        isDefault: true,
      },
      {
        userId: customerRahul.id,
        line1: 'Villa 12, Green Glen Layout, Bellandur',
        line2: 'Behind Ecospace Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560103',
        isDefault: true,
      },
      {
        userId: customerAnanya.id,
        line1: '#88, 14th Main, Sector 4, HSR Layout',
        line2: 'Opposite BDA Complex',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102',
        isDefault: true,
      },
    ],
  });

  console.log('✅ Accounts initialized:');
  console.log('   Admin:    admin@stocksense.com / admin123');
  console.log('   Staff:    staff@stocksense.com / admin123');
  console.log('   Customer: customer@example.com / customer123');

  // ─── 2. Multi-Tier Warehouse Locations ─────────────────────────────────────
  // Primary Dark Store
  const darkStore = await prisma.location.create({
    data: { name: 'Dark Store — Indiranagar', code: 'DS-IND-01' },
  });

  const coldRoom = await prisma.location.create({
    data: { name: 'Cold Room (Dairy & Frozen)', code: 'COLD-01', parentId: darkStore.id },
  });
  const dryGoods = await prisma.location.create({
    data: { name: 'Dry Goods & Staples Aisle', code: 'DRY-01', parentId: darkStore.id },
  });
  const freshProduce = await prisma.location.create({
    data: { name: 'Fresh Produce Rack', code: 'FRESH-01', parentId: darkStore.id },
  });
  const snackAisle = await prisma.location.create({
    data: { name: 'Snacks & Beverages Zone', code: 'SNK-01', parentId: darkStore.id },
  });
  const personalCare = await prisma.location.create({
    data: { name: 'Personal Care & Household Station', code: 'PC-01', parentId: darkStore.id },
  });

  // Secondary Central Distribution Facility
  const centralHub = await prisma.location.create({
    data: { name: 'Central Fulfilment Center — Whitefield', code: 'CFC-WH-02' },
  });
  const bulkStaging = await prisma.location.create({
    data: { name: 'Bulk Pallet Inbound Bay', code: 'BULK-01', parentId: centralHub.id },
  });

  // ─── 3. Categories ─────────────────────────────────────────────────────────
  const catDairy = await prisma.category.create({ data: { name: 'Dairy & Breakfast' } });
  const catFruits = await prisma.category.create({ data: { name: 'Fruits & Vegetables' } });
  const catStaples = await prisma.category.create({ data: { name: 'Atta, Rice & Dal' } });
  const catSnacks = await prisma.category.create({ data: { name: 'Snacks & Munchies' } });
  const catBeverages = await prisma.category.create({ data: { name: 'Cold Drinks & Juices' } });
  const catInstant = await prisma.category.create({ data: { name: 'Instant & Ready to Eat' } });
  const catPersonal = await prisma.category.create({ data: { name: 'Personal Care' } });
  const catHousehold = await prisma.category.create({ data: { name: 'Cleaning & Household' } });

  // ─── 4. Suppliers ──────────────────────────────────────────────────────────
  const supAmul = await prisma.supplier.create({
    data: {
      name: 'Amul Dairy Cooperative',
      email: 'orders@amul.coop',
      phone: '+91 2692 258506',
      address: 'Amul Dairy Road, Anand, Gujarat 388001',
    },
  });

  const supITC = await prisma.supplier.create({
    data: {
      name: 'ITC Foods Distribution',
      email: 'b2borders@itcfoods.com',
      phone: '+91 33 2288 9371',
      address: 'Virginia House, 37 J.L. Nehru Road, Kolkata 700071',
    },
  });

  const supHUL = await prisma.supplier.create({
    data: {
      name: 'Hindustan Unilever Supply Chain',
      email: 'distrib@hul.co.in',
      phone: '+91 22 3983 0000',
      address: 'Unilever House, B.D. Sawant Marg, Chakala, Mumbai 400099',
    },
  });

  const supNestle = await prisma.supplier.create({
    data: {
      name: 'Nestlé India Distribution',
      email: 'orders@nestle.in',
      phone: '+91 124 234 1212',
      address: 'Nestlé House, Jacaranda Marg, DLF Phase II, Gurugram 122002',
    },
  });

  const supTata = await prisma.supplier.create({
    data: {
      name: 'Tata Consumer Products Ltd.',
      email: 'care@tataconsumer.com',
      phone: '+91 80 6717 1200',
      address: '11/1 Palace Road, Vasanth Nagar, Bengaluru 560052',
    },
  });

  const supBritannia = await prisma.supplier.create({
    data: {
      name: 'Britannia Industries Ltd.',
      email: 'supply@britannia.co.in',
      phone: '+91 80 3768 7100',
      address: '5/1A Hungerford Street, Kolkata 700017',
    },
  });

  // ─── 5. Rich Catalog of Products across Categories ─────────────────────────
  const catalog = [
    // ── Dairy & Breakfast ──
    {
      name: 'Amul Taaza Toned Fresh Milk — 500 ml',
      sku: 'DAIRY-AMUL-TM-500',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 27,
      reorderPoint: 40,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/390971a.jpg',
      isVisibleOnStore: true,
      description: 'Amul Taaza Homogenised Toned Milk — 500 ml pouch. 3.0% fat, 8.5% SNF. Fresh, nutrient-rich pasteurised milk.',
      initialQty: 180,
      locationId: coldRoom.id,
    },
    {
      name: 'Amul Gold Full Cream Milk — 1 L',
      sku: 'DAIRY-AMUL-GOLD-1L',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 68,
      reorderPoint: 30,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/390973a.jpg',
      isVisibleOnStore: true,
      description: 'Amul Gold Full Cream Fresh Milk — 1 litre pack. 6.0% fat, 9.0% SNF. Rich, creamy, perfect for tea, coffee, and sweets.',
      initialQty: 110,
      locationId: coldRoom.id,
    },
    {
      name: 'Mother Dairy Classic Dahi — 400 g',
      sku: 'DAIRY-MD-CURD-400',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 40,
      reorderPoint: 25,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/351483a.jpg',
      isVisibleOnStore: true,
      description: 'Mother Dairy Classic Dahi — 400 g tub. Naturally cultured, thick, and delicious for meals or raita.',
      initialQty: 75,
      locationId: coldRoom.id,
    },
    {
      name: 'Amul Pasteurised Salted Butter — 500 g',
      sku: 'DAIRY-AMUL-BTR-500',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 275,
      reorderPoint: 25, // LOW STOCK: 6 <= 25 (Triggers Restock Attention)
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/32aborr.jpg',
      isVisibleOnStore: true,
      description: 'Amul Pasteurised Butter — 500 g carton. Utterly butterly delicious, perfect for breakfast toasts and cooking.',
      initialQty: 6,
      locationId: coldRoom.id,
    },
    {
      name: 'Amul Processed Cheese Slices — 200 g (10 Slices)',
      sku: 'DAIRY-AMUL-CS-200',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 135,
      reorderPoint: 20, // LOW STOCK: 4 <= 20 (Triggers Restock Attention)
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/24527a.jpg',
      isVisibleOnStore: true,
      description: 'Amul Processed Cheese Slices — 200 g. 10 individually wrapped slices, rich in calcium and milk protein.',
      initialQty: 4,
      locationId: coldRoom.id,
    },
    {
      name: 'Farm Fresh White Eggs — Tray of 12',
      sku: 'DAIRY-EGGS-12',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 88,
      reorderPoint: 30,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/412133a.jpg',
      isVisibleOnStore: true,
      description: 'Hygienically sorted and sanitized farm-fresh eggs. Rich in protein, packaged in a shock-absorbing tray.',
      initialQty: 90,
      locationId: coldRoom.id,
    },
    {
      name: 'Milky Mist Farm Fresh Paneer — 200 g',
      sku: 'DAIRY-MM-PAN-200',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 95,
      reorderPoint: 20,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/480036a.jpg',
      isVisibleOnStore: true,
      description: 'Soft, creamy, vacuum-packed cottage cheese. High protein, ready to slice and cook.',
      initialQty: 50,
      locationId: coldRoom.id,
    },

    // ── Fresh Fruits & Vegetables ──
    {
      name: 'Fresh Red Onions — 1 kg',
      sku: 'FRESH-ONION-1KG',
      categoryId: catFruits.id,
      uom: 'kg',
      price: 36,
      reorderPoint: 50,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/2702a.jpg',
      isVisibleOnStore: true,
      description: 'Crisp, pungent red onions. Essential staple for curries, salads, and everyday Indian gravies.',
      initialQty: 220,
      locationId: freshProduce.id,
    },
    {
      name: 'Farm Hybrid Tomatoes — 1 kg',
      sku: 'FRESH-TOMATO-1KG',
      categoryId: catFruits.id,
      uom: 'kg',
      price: 32,
      reorderPoint: 40,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/2806a.jpg',
      isVisibleOnStore: true,
      description: 'Plump, firm, and tangy red tomatoes freshly harvested from local farms.',
      initialQty: 175,
      locationId: freshProduce.id,
    },
    {
      name: 'Fresh New Potatoes — 1 kg',
      sku: 'FRESH-POTATO-1KG',
      categoryId: catFruits.id,
      uom: 'kg',
      price: 29,
      reorderPoint: 50,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/2774a.jpg',
      isVisibleOnStore: true,
      description: 'Firm and smooth potatoes, ideal for boiling, roasting, or everyday vegetable curries.',
      initialQty: 240,
      locationId: freshProduce.id,
    },
    {
      name: 'Fresh Robusta Bananas — 1 Dozen',
      sku: 'FRESH-BANANA-12',
      categoryId: catFruits.id,
      uom: 'pcs',
      price: 48,
      reorderPoint: 30,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/3702a.jpg',
      isVisibleOnStore: true,
      description: 'Naturally ripened, sweet bananas. Energy-dense and rich in dietary potassium.',
      initialQty: 95,
      locationId: freshProduce.id,
    },
    {
      name: 'Fresh Coriander (Dhaniya) — 100 g',
      sku: 'FRESH-CORI-100G',
      categoryId: catFruits.id,
      uom: 'pcs',
      price: 15,
      reorderPoint: 25,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/480037a.jpg',
      isVisibleOnStore: true,
      description: 'Crisp green leaves with robust aroma for garnishing and chutneys.',
      initialQty: 60,
      locationId: freshProduce.id,
    },
    {
      name: 'Shimla Royal Apple — Pack of 4',
      sku: 'FRESH-APPLE-4PK',
      categoryId: catFruits.id,
      uom: 'pcs',
      price: 140,
      reorderPoint: 20,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/3709a.jpg',
      isVisibleOnStore: true,
      description: 'Crisp, sweet, and juicy Himachal apples, carefully selected and packed.',
      initialQty: 55,
      locationId: freshProduce.id,
    },

    // ── Atta, Rice, Oil & Dal ──
    {
      name: 'Aashirvaad Shudh Superior MP Chakki Atta — 5 kg',
      sku: 'STAPLE-ATTA-5KG',
      categoryId: catStaples.id,
      uom: 'pcs',
      price: 279,
      reorderPoint: 25,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/240092a.jpg',
      isVisibleOnStore: true,
      description: '100% pure whole wheat grain flour with 0% maida. Makes soft, fluffy rotis.',
      initialQty: 85,
      locationId: dryGoods.id,
    },
    {
      name: 'Fortune Sunlite Refined Sunflower Oil — 1 L Pouch',
      sku: 'STAPLE-OIL-SUN-1L',
      categoryId: catStaples.id,
      uom: 'pcs',
      price: 142,
      reorderPoint: 20, // LOW STOCK: 5 <= 20 (Triggers Restock Attention)
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/160a.jpg',
      isVisibleOnStore: true,
      description: 'Light and healthy refined sunflower oil enriched with Vitamins A and D.',
      initialQty: 5,
      locationId: dryGoods.id,
    },
    {
      name: 'India Gate Feast Rozzana Basmati Rice — 1 kg',
      sku: 'STAPLE-RICE-BAS-1KG',
      categoryId: catStaples.id,
      uom: 'pcs',
      price: 99,
      reorderPoint: 30,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/35882a.jpg',
      isVisibleOnStore: true,
      description: 'Aromatic, long-grain aged basmati rice for daily pulav, fried rice, and biryani.',
      initialQty: 90,
      locationId: dryGoods.id,
    },
    {
      name: 'Tata Sampann Unpolished Toor Dal — 1 kg',
      sku: 'STAPLE-DAL-TOOR-1KG',
      categoryId: catStaples.id,
      uom: 'pcs',
      price: 175,
      reorderPoint: 25,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/115509a.jpg',
      isVisibleOnStore: true,
      description: 'Unpolished pigeon peas retaining natural protein and authentic earthy aroma.',
      initialQty: 80,
      locationId: dryGoods.id,
    },
    {
      name: 'Tata Salt Vacuum Evaporated Iodised Salt — 1 kg',
      sku: 'STAPLE-SALT-1KG',
      categoryId: catStaples.id,
      uom: 'pcs',
      price: 28,
      reorderPoint: 40,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/24194a.jpg',
      isVisibleOnStore: true,
      description: 'Desh Ka Namak. Pure, vacuum-evaporated iodised table salt.',
      initialQty: 140,
      locationId: dryGoods.id,
    },

    // ── Snacks & Munchies ──
    {
      name: "Lay's India's Magic Masala Potato Chips — 50 g",
      sku: 'SNACK-LAYS-MM-50',
      categoryId: catSnacks.id,
      uom: 'pcs',
      price: 20,
      reorderPoint: 40,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/10894a.jpg',
      isVisibleOnStore: true,
      description: 'Thin, crispy potato wafers tossed in authentic Indian savory masala spices.',
      initialQty: 130,
      locationId: snackAisle.id,
    },
    {
      name: 'Kurkure Masala Munch Crispy Namkeen — 85 g',
      sku: 'SNACK-KK-MM-85',
      categoryId: catSnacks.id,
      uom: 'pcs',
      price: 20,
      reorderPoint: 35,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/10892a.jpg',
      isVisibleOnStore: true,
      description: 'Tedha hai par mera hai! Crunchy spiced corn puffs bursting with punchy chatpata flavors.',
      initialQty: 110,
      locationId: snackAisle.id,
    },
    {
      name: "Haldiram's Nagpur Aloo Bhujia — 200 g",
      sku: 'SNACK-HR-ALOO-200',
      categoryId: catSnacks.id,
      uom: 'pcs',
      price: 58,
      reorderPoint: 25,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/24184a.jpg',
      isVisibleOnStore: true,
      description: 'Spicy potato sev with cooling mint and tangy Indian spices.',
      initialQty: 75,
      locationId: snackAisle.id,
    },
    {
      name: 'Britannia Good Day Butter Cookies — 200 g',
      sku: 'SNACK-BRIT-GD-200',
      categoryId: catSnacks.id,
      uom: 'pcs',
      price: 45,
      reorderPoint: 30,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/19087a.jpg',
      isVisibleOnStore: true,
      description: 'Rich, crumbly butter cookies baked with the signature cheerful smile pattern.',
      initialQty: 85,
      locationId: snackAisle.id,
    },
    {
      name: 'Parle-G Original Glucose Biscuits — 250 g',
      sku: 'SNACK-PARLE-G-250',
      categoryId: catSnacks.id,
      uom: 'pcs',
      price: 30,
      reorderPoint: 40,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/19089a.jpg',
      isVisibleOnStore: true,
      description: "India's favorite chai companion. Wholesome wheat and milk glucose biscuits.",
      initialQty: 150,
      locationId: snackAisle.id,
    },
    {
      name: 'Cadbury Dairy Milk Silk Chocolate Bar — 150 g',
      sku: 'SNACK-CDM-SILK-150',
      categoryId: catSnacks.id,
      uom: 'pcs',
      price: 175,
      reorderPoint: 15, // OUT OF STOCK: 0 units (Triggers Out of Stock Alert)
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/410489a.jpg',
      isVisibleOnStore: true,
      description: 'Smoother, creamier, and silkier chocolate bar that melts in your mouth.',
      initialQty: 0,
      locationId: snackAisle.id,
    },

    // ── Cold Drinks & Juices ──
    {
      name: 'Coca-Cola Original Taste Soft Drink — 750 ml Pet Bottle',
      sku: 'BEV-COKE-750',
      categoryId: catBeverages.id,
      uom: 'pcs',
      price: 40,
      reorderPoint: 30,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/287a.jpg',
      isVisibleOnStore: true,
      description: 'Sparkling refreshment with crisp, unmistakable cola flavor. Serve chilled.',
      initialQty: 95,
      locationId: snackAisle.id,
    },
    {
      name: 'Thums Up Charged Soft Drink — 750 ml Pet Bottle',
      sku: 'BEV-THUMS-750',
      categoryId: catBeverages.id,
      uom: 'pcs',
      price: 40,
      reorderPoint: 25,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/290a.jpg',
      isVisibleOnStore: true,
      description: 'Taste the thunder! Strong, fizzy, and spicy cola punch for maximum refreshment.',
      initialQty: 80,
      locationId: snackAisle.id,
    },
    {
      name: 'Sprite Lemon-Lime Refreshing Soft Drink — 750 ml',
      sku: 'BEV-SPRITE-750',
      categoryId: catBeverages.id,
      uom: 'pcs',
      price: 40,
      reorderPoint: 25,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/296a.jpg',
      isVisibleOnStore: true,
      description: 'Clear, crisp, and thirst-quenching lime flavor with intense fizz. Clear hai!',
      initialQty: 85,
      locationId: snackAisle.id,
    },
    {
      name: 'Real Fruit Power Mixed Fruit Juice — 1 L Tetrapack',
      sku: 'BEV-REAL-MF-1L',
      categoryId: catBeverages.id,
      uom: 'pcs',
      price: 125,
      reorderPoint: 20,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/25500a.jpg',
      isVisibleOnStore: true,
      description: 'Blended from nine delicious fruits. Enriched with natural Vitamin C, zero added preservatives.',
      initialQty: 55,
      locationId: snackAisle.id,
    },
    {
      name: 'Coca-Cola Zero Sugar Can — 300 ml',
      sku: 'BEV-COKE-ZERO-300',
      categoryId: catBeverages.id,
      uom: 'pcs',
      price: 40,
      reorderPoint: 20, // OUT OF STOCK: 0 units (Triggers Out of Stock Alert)
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/289a.jpg',
      isVisibleOnStore: true,
      description: 'Classic Coca-Cola taste with zero sugar and zero calories. Chilled can.',
      initialQty: 0,
      locationId: snackAisle.id,
    },

    // ── Instant & Ready to Eat ──
    {
      name: 'Maggi 2-Minute Masala Instant Noodles — Pack of 4 (280 g)',
      sku: 'INST-MAGGI-4PK',
      categoryId: catInstant.id,
      uom: 'pcs',
      price: 58,
      reorderPoint: 35,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/439697a.jpg',
      isVisibleOnStore: true,
      description: 'The iconic 2-minute snack. Fortified with iron and roasted aromatic Indian spices.',
      initialQty: 165,
      locationId: dryGoods.id,
    },
    {
      name: 'Tata Tea Gold Leaf Tea — 500 g',
      sku: 'BEV-TT-GOLD-500',
      categoryId: catInstant.id,
      uom: 'pcs',
      price: 330,
      reorderPoint: 20, // LOW STOCK: 7 <= 20 (Triggers Restock Attention)
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/240093a.jpg',
      isVisibleOnStore: true,
      description: 'Exquisite blend of fine Assam CTC tea leaves gently rolled with long leaves for superior aroma.',
      initialQty: 7,
      locationId: dryGoods.id,
    },
    {
      name: 'Nescafé Classic Instant Coffee Glass Jar — 100 g',
      sku: 'BEV-NES-CLASS-100',
      categoryId: catInstant.id,
      uom: 'pcs',
      price: 385,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/3221a.jpg',
      isVisibleOnStore: true,
      description: '100% pure roasted Robusta coffee beans delivering rich, bold morning energy.',
      initialQty: 48,
      locationId: dryGoods.id,
    },
    {
      name: 'Kellogg’s Original Corn Flakes — 475 g Box',
      sku: 'INST-KEL-CORN-475',
      categoryId: catInstant.id,
      uom: 'pcs',
      price: 215,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/16015a.jpg',
      isVisibleOnStore: true,
      description: 'Crispy sun-ripened corn flakes packed with 8 essential vitamins and iron for a nutritious breakfast.',
      initialQty: 42,
      locationId: dryGoods.id,
    },

    // ── Personal Care ──
    {
      name: 'Dettol Original Germ Protection Bathing Soap — 4 x 75 g Pack',
      sku: 'PC-DETT-SOAP-4X75',
      categoryId: catPersonal.id,
      uom: 'pcs',
      price: 155,
      reorderPoint: 20,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/21044a.jpg',
      isVisibleOnStore: true,
      description: 'Provides 100% better protection against illness-causing germs. Classic antiseptic pine fragrance.',
      initialQty: 70,
      locationId: personalCare.id,
    },
    {
      name: 'Colgate Strong Teeth Anticavity Dental Cream — 200 g',
      sku: 'PC-COLG-ST-200',
      categoryId: catPersonal.id,
      uom: 'pcs',
      price: 120,
      reorderPoint: 25,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/20921a.jpg',
      isVisibleOnStore: true,
      description: 'Amino Shakti formula adds natural calcium for 2x stronger teeth and healthy gums.',
      initialQty: 90,
      locationId: personalCare.id,
    },
    {
      name: 'Head & Shoulders Anti-Dandruff Shampoo — 340 ml',
      sku: 'PC-HNS-AD-340',
      categoryId: catPersonal.id,
      uom: 'pcs',
      price: 265,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/32281a.jpg',
      isVisibleOnStore: true,
      description: 'Clinically proven up to 100% dandruff-free hair. Gentle for daily use.',
      initialQty: 40,
      locationId: personalCare.id,
    },

    // ── Cleaning & Household ──
    {
      name: 'Surf Excel Easy Wash Detergent Powder — 1.5 kg',
      sku: 'HH-SURF-EW-1.5',
      categoryId: catHousehold.id,
      uom: 'pcs',
      price: 199,
      reorderPoint: 20,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/20898a.jpg',
      isVisibleOnStore: true,
      description: 'Formulated with superfine powder that unleashes the power of 10 hands to lift tough dried-in stains.',
      initialQty: 60,
      locationId: personalCare.id,
    },
    {
      name: 'Vim Dishwash Gel Lemon — 750 ml Bottle',
      sku: 'HH-VIM-GEL-750',
      categoryId: catHousehold.id,
      uom: 'pcs',
      price: 145,
      reorderPoint: 20,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/20862a.jpg',
      isVisibleOnStore: true,
      description: 'Infused with the degreasing power of 100 lemons. Cleans greasy utensils without leaving residue.',
      initialQty: 65,
      locationId: personalCare.id,
    },
    {
      name: 'Harpic Power Plus Original Toilet Cleaner — 1 L',
      sku: 'HH-HARP-PP-1L',
      categoryId: catHousehold.id,
      uom: 'pcs',
      price: 160,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/31367a.jpg',
      isVisibleOnStore: true,
      description: '10x better stain and limescale removal. Thick liquid formula clings to surfaces for maximum disinfection.',
      initialQty: 52,
      locationId: personalCare.id,
    },
  ];

  // Insert catalog products & create baseline stock levels + initial ledger moves
  const createdProductsMap = new Map();

  for (const item of catalog) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        sku: item.sku,
        categoryId: item.categoryId,
        uom: item.uom,
        price: item.price,
        reorderPoint: item.reorderPoint,
        imageUrl: item.imageUrl,
        isVisibleOnStore: item.isVisibleOnStore,
        description: item.description,
      },
    });

    createdProductsMap.set(item.sku, product);

    if (item.initialQty > 0) {
      await prisma.stockLevel.create({
        data: {
          productId: product.id,
          locationId: item.locationId,
          quantity: item.initialQty,
        },
      });

      await prisma.stockMove.create({
        data: {
          productId: product.id,
          locationId: item.locationId,
          quantityChange: item.initialQty,
          moveType: 'ADJUSTMENT',
          referenceId: product.id,
          referenceType: 'initial_stock_setup',
          createdBy: manager.id,
        },
      });
    }
  }

  console.log(`📦 Catalog loaded: ${catalog.length} SKUs across 8 categories`);

  // Helper product lookups
  const pMilk = createdProductsMap.get('DAIRY-AMUL-TM-500');
  const pCurd = createdProductsMap.get('DAIRY-MD-CURD-400');
  const pPaneer = createdProductsMap.get('DAIRY-MM-PAN-200');
  const pAtta = createdProductsMap.get('STAPLE-ATTA-5KG');
  const pOil = createdProductsMap.get('STAPLE-OIL-SUN-1L');
  const pRice = createdProductsMap.get('STAPLE-RICE-BAS-1KG');
  const pSalt = createdProductsMap.get('STAPLE-SALT-1KG');
  const pMaggi = createdProductsMap.get('INST-MAGGI-4PK');
  const pCoke = createdProductsMap.get('BEV-COKE-750');
  const pEggs = createdProductsMap.get('DAIRY-EGGS-12');
  const pOnion = createdProductsMap.get('FRESH-ONION-1KG');
  const pTomato = createdProductsMap.get('FRESH-TOMATO-1KG');
  const pSurf = createdProductsMap.get('HH-SURF-EW-1.5');
  const pHarpic = createdProductsMap.get('HH-HARP-PP-1L');
  const pVim = createdProductsMap.get('HH-VIM-GEL-750');
  const pDettol = createdProductsMap.get('PC-DETT-SOAP-4X75');
  const pParleG = createdProductsMap.get('SNACK-PARLE-G-250');
  const pLays = createdProductsMap.get('SNACK-LAYS-MM-50');
  const pCheese = createdProductsMap.get('DAIRY-AMUL-CS-200');
  const pRealJuice = createdProductsMap.get('BEV-REAL-MF-1L');
  const pKurkure = createdProductsMap.get('SNACK-KK-MM-85');

  // ─── 6. Realistic Inbound Receipts (Suppliers -> Warehouse) ────────────────
  // Inbound Receipt 1: Completed Dairy Inbound from Amul
  const rec1 = await prisma.receipt.create({
    data: {
      reference: 'REC-202609-1001',
      supplierId: supAmul.id,
      locationId: coldRoom.id,
      status: 'DONE',
      notes: 'Morning fresh dairy dispatch — certified temperature compliant',
      createdBy: manager.id,
      validatedAt: new Date(Date.now() - 3600 * 1000 * 24),
      lines: {
        create: [
          { productId: pMilk.id, quantity: 100, uom: 'pcs' },
          { productId: pCurd.id, quantity: 40, uom: 'pcs' },
          { productId: pPaneer.id, quantity: 30, uom: 'pcs' },
        ],
      },
    },
  });

  await prisma.stockMove.createMany({
    data: [
      {
        productId: pMilk.id,
        locationId: coldRoom.id,
        quantityChange: 100,
        moveType: 'RECEIPT',
        referenceId: rec1.id,
        referenceType: 'receipt',
        createdBy: manager.id,
      },
      {
        productId: pCurd.id,
        locationId: coldRoom.id,
        quantityChange: 40,
        moveType: 'RECEIPT',
        referenceId: rec1.id,
        referenceType: 'receipt',
        createdBy: manager.id,
      },
    ],
  });

  // Inbound Receipt 2: READY for receipt validation from ITC Foods (Awaiting Staff)
  await prisma.receipt.create({
    data: {
      reference: 'REC-202609-1002',
      supplierId: supITC.id,
      locationId: dryGoods.id,
      status: 'READY',
      notes: 'Weekly staples restock — Aashirvaad Atta and Sunfeast batches',
      createdBy: manager.id,
      lines: {
        create: [
          { productId: pAtta.id, quantity: 50, uom: 'pcs' },
          { productId: pRice.id, quantity: 40, uom: 'pcs' },
        ],
      },
    },
  });

  // Inbound Receipt 3: DRAFT restock from Tata Consumer
  await prisma.receipt.create({
    data: {
      reference: 'REC-202609-1003',
      supplierId: supTata.id,
      locationId: dryGoods.id,
      status: 'DRAFT',
      notes: 'Scheduled tea & salt requisition order',
      createdBy: staff.id,
      lines: {
        create: [
          { productId: pSalt.id, quantity: 60, uom: 'pcs' },
        ],
      },
    },
  });

  // ─── 7. Inter-Warehouse Transfers ──────────────────────────────────────────
  // Completed Transfer from Central Bulk Hub -> Indiranagar Dark Store
  const trf1 = await prisma.internalTransfer.create({
    data: {
      reference: 'TRF-202609-001',
      sourceLocationId: bulkStaging.id,
      destLocationId: dryGoods.id,
      status: 'DONE',
      validatedAt: new Date(Date.now() - 3600 * 1000 * 12),
      createdBy: manager.id,
      lines: {
        create: [
          { productId: pParleG.id, quantity: 50 },
          { productId: pMaggi.id, quantity: 40 },
        ],
      },
    },
  });

  await prisma.stockMove.createMany({
    data: [
      {
        productId: pParleG.id,
        locationId: bulkStaging.id,
        quantityChange: -50,
        moveType: 'TRANSFER_OUT',
        referenceId: trf1.id,
        referenceType: 'internal_transfer',
        createdBy: manager.id,
      },
      {
        productId: pParleG.id,
        locationId: dryGoods.id,
        quantityChange: 50,
        moveType: 'TRANSFER_IN',
        referenceId: trf1.id,
        referenceType: 'internal_transfer',
        createdBy: manager.id,
      },
    ],
  });

  // Scheduled / READY Transfer from Dry Goods -> Snack Aisle for replenishment
  await prisma.internalTransfer.create({
    data: {
      reference: 'TRF-202609-002',
      sourceLocationId: dryGoods.id,
      destLocationId: snackAisle.id,
      status: 'READY',
      createdBy: staff.id,
      lines: {
        create: [
          { productId: pLays.id, quantity: 20 },
        ],
      },
    },
  });

  // ─── 8. Physical Inventory Audit Adjustments ───────────────────────────────
  const adj1 = await prisma.stockAdjustment.create({
    data: {
      productId: pCheese.id,
      locationId: coldRoom.id,
      previousQty: 7,
      countedQty: 4,
      difference: -3,
      reason: 'Physical count audit: 3 expired/damaged packs discarded from rack',
      createdBy: manager.id,
    },
  });

  await prisma.stockMove.create({
    data: {
      productId: pCheese.id,
      locationId: coldRoom.id,
      quantityChange: -3,
      moveType: 'ADJUSTMENT',
      referenceId: adj1.id,
      referenceType: 'stock_adjustment',
      createdBy: manager.id,
    },
  });

  // ─── 9. Customer Orders & Storefront Outgoing Deliveries ───────────────────
  // Order 1: Priya Sharma (Awaiting Warehouse Pack & Ship -> in Live Store Orders Queue)
  const orderNum1 = 'ORD-202609-8812';
  const order1 = await prisma.customerOrder.create({
    data: {
      orderNumber: orderNum1,
      customerId: customerPriya.id,
      status: 'CONFIRMED',
      totalAmount: 27 * 2 + 279 + 58 * 2 + 40, // 489
      paymentMethod: 'COD',
      customerPhone: '+91 98765 43210',
      shippingAddress: {
        name: 'Priya Sharma',
        phone: '+91 98765 43210',
        line1: 'Flat 402, Sunshine Apartments, 5th Cross Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      notes: 'Please ring the bell twice on arrival',
      lines: {
        create: [
          { productId: pMilk.id, quantity: 2, unitPrice: 27, total: 54 },
          { productId: pAtta.id, quantity: 1, unitPrice: 279, total: 279 },
          { productId: pMaggi.id, quantity: 2, unitPrice: 58, total: 116 },
          { productId: pCoke.id, quantity: 1, unitPrice: 40, total: 40 },
        ],
      },
    },
  });

  await prisma.deliveryOrder.create({
    data: {
      reference: `DEL-${orderNum1}`,
      customerName: 'Priya Sharma (COD #8812)',
      locationId: darkStore.id,
      status: 'READY',
      source: 'CUSTOMER_ORDER',
      customerOrderId: order1.id,
      notes: `Storefront COD Order #${orderNum1} — Deliver to Indiranagar (₹489)`,
      createdBy: customerPriya.id,
      lines: {
        create: [
          { productId: pMilk.id, quantity: 2 },
          { productId: pAtta.id, quantity: 1 },
          { productId: pMaggi.id, quantity: 2 },
          { productId: pCoke.id, quantity: 1 },
        ],
      },
    },
  });

  // Deduct stock for order 1
  await prisma.stockLevel.update({
    where: { productId_locationId: { productId: pMilk.id, locationId: coldRoom.id } },
    data: { quantity: { decrement: 2 } },
  });
  await prisma.stockLevel.update({
    where: { productId_locationId: { productId: pAtta.id, locationId: dryGoods.id } },
    data: { quantity: { decrement: 1 } },
  });
  await prisma.stockLevel.update({
    where: { productId_locationId: { productId: pMaggi.id, locationId: dryGoods.id } },
    data: { quantity: { decrement: 2 } },
  });
  await prisma.stockLevel.update({
    where: { productId_locationId: { productId: pCoke.id, locationId: snackAisle.id } },
    data: { quantity: { decrement: 1 } },
  });

  await prisma.stockMove.createMany({
    data: [
      {
        productId: pMilk.id,
        locationId: coldRoom.id,
        quantityChange: -2,
        moveType: 'DELIVERY',
        referenceId: order1.id,
        referenceType: 'customer_order',
        createdBy: customerPriya.id,
      },
      {
        productId: pAtta.id,
        locationId: dryGoods.id,
        quantityChange: -1,
        moveType: 'DELIVERY',
        referenceId: order1.id,
        referenceType: 'customer_order',
        createdBy: customerPriya.id,
      },
    ],
  });

  // Order 2: Rahul Verma (Awaiting warehouse dispatch)
  const orderNum2 = 'ORD-202609-8815';
  const order2 = await prisma.customerOrder.create({
    data: {
      orderNumber: orderNum2,
      customerId: customerRahul.id,
      status: 'PLACED',
      totalAmount: 125 + 20 * 2 + 30, // 195
      paymentMethod: 'COD',
      customerPhone: '+91 98234 56789',
      shippingAddress: {
        name: 'Rahul Verma',
        phone: '+91 98234 56789',
        line1: 'Villa 12, Green Glen Layout, Bellandur',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560103',
      },
      notes: 'Leave at security desk if unavailable',
      lines: {
        create: [
          { productId: pRealJuice.id, quantity: 1, unitPrice: 125, total: 125 },
          { productId: pKurkure.id, quantity: 2, unitPrice: 20, total: 40 },
          { productId: pParleG.id, quantity: 1, unitPrice: 30, total: 30 },
        ],
      },
    },
  });

  await prisma.deliveryOrder.create({
    data: {
      reference: `DEL-${orderNum2}`,
      customerName: 'Rahul Verma (COD #8815)',
      locationId: darkStore.id,
      status: 'READY',
      source: 'CUSTOMER_ORDER',
      customerOrderId: order2.id,
      notes: `Storefront COD Order #${orderNum2} — Deliver to Bellandur (₹195)`,
      createdBy: customerRahul.id,
      lines: {
        create: [
          { productId: pRealJuice.id, quantity: 1 },
          { productId: pKurkure.id, quantity: 2 },
          { productId: pParleG.id, quantity: 1 },
        ],
      },
    },
  });

  // Deduct stock for order 2
  await prisma.stockLevel.update({
    where: { productId_locationId: { productId: pRealJuice.id, locationId: snackAisle.id } },
    data: { quantity: { decrement: 1 } },
  });
  await prisma.stockLevel.update({
    where: { productId_locationId: { productId: pKurkure.id, locationId: snackAisle.id } },
    data: { quantity: { decrement: 2 } },
  });
  await prisma.stockLevel.update({
    where: { productId_locationId: { productId: pParleG.id, locationId: snackAisle.id } },
    data: { quantity: { decrement: 1 } },
  });

  await prisma.stockMove.createMany({
    data: [
      {
        productId: pRealJuice.id,
        locationId: snackAisle.id,
        quantityChange: -1,
        moveType: 'DELIVERY',
        referenceId: order2.id,
        referenceType: 'customer_order',
        createdBy: customerRahul.id,
      },
      {
        productId: pKurkure.id,
        locationId: snackAisle.id,
        quantityChange: -2,
        moveType: 'DELIVERY',
        referenceId: order2.id,
        referenceType: 'customer_order',
        createdBy: customerRahul.id,
      },
    ],
  });

  // Order 3: Ananya Patel (OUT FOR DELIVERY by runner)
  const orderNum3 = 'ORD-202609-8801';
  const order3 = await prisma.customerOrder.create({
    data: {
      orderNumber: orderNum3,
      customerId: customerAnanya.id,
      status: 'OUT_FOR_DELIVERY',
      totalAmount: 88 + 40 + 36 + 32, // 196
      paymentMethod: 'COD',
      customerPhone: '+91 97112 33445',
      shippingAddress: {
        name: 'Ananya Patel',
        phone: '+91 97112 33445',
        line1: '#88, 14th Main, Sector 4, HSR Layout',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102',
      },
      lines: {
        create: [
          { productId: pEggs.id, quantity: 1, unitPrice: 88, total: 88 },
          { productId: pCurd.id, quantity: 1, unitPrice: 40, total: 40 },
          { productId: pOnion.id, quantity: 1, unitPrice: 36, total: 36 },
          { productId: pTomato.id, quantity: 1, unitPrice: 32, total: 32 },
        ],
      },
    },
  });

  await prisma.deliveryOrder.create({
    data: {
      reference: `DEL-${orderNum3}`,
      customerName: 'Ananya Patel (COD #8801)',
      locationId: darkStore.id,
      status: 'READY',
      source: 'CUSTOMER_ORDER',
      customerOrderId: order3.id,
      notes: 'Out for delivery via fast runner #04',
      createdBy: customerAnanya.id,
      lines: {
        create: [
          { productId: pEggs.id, quantity: 1 },
          { productId: pCurd.id, quantity: 1 },
          { productId: pOnion.id, quantity: 1 },
          { productId: pTomato.id, quantity: 1 },
        ],
      },
    },
  });

  // Order 4: Historical Delivered Order (Completed earlier today)
  const orderNum4 = 'ORD-202609-7750';
  const order4 = await prisma.customerOrder.create({
    data: {
      orderNumber: orderNum4,
      customerId: customerPriya.id,
      status: 'DELIVERED',
      totalAmount: 199 + 160 + 145 + 155, // 659
      paymentMethod: 'COD',
      customerPhone: '+91 98765 43210',
      shippingAddress: {
        name: 'Priya Sharma',
        phone: '+91 98765 43210',
        line1: 'Flat 402, Sunshine Apartments, 5th Cross Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      lines: {
        create: [
          { productId: pSurf.id, quantity: 1, unitPrice: 199, total: 199 },
          { productId: pHarpic.id, quantity: 1, unitPrice: 160, total: 160 },
          { productId: pVim.id, quantity: 1, unitPrice: 145, total: 145 },
          { productId: pDettol.id, quantity: 1, unitPrice: 155, total: 155 },
        ],
      },
    },
  });

  await prisma.deliveryOrder.create({
    data: {
      reference: `DEL-${orderNum4}`,
      customerName: 'Priya Sharma (COD #7750)',
      locationId: darkStore.id,
      status: 'DONE',
      source: 'CUSTOMER_ORDER',
      customerOrderId: order4.id,
      validatedAt: new Date(Date.now() - 3600 * 1000 * 4),
      notes: 'Delivered and cash collected ₹659',
      createdBy: manager.id,
      lines: {
        create: [
          { productId: pSurf.id, quantity: 1 },
          { productId: pHarpic.id, quantity: 1 },
          { productId: pVim.id, quantity: 1 },
          { productId: pDettol.id, quantity: 1 },
        ],
      },
    },
  });

  console.log('✅ Realistic operational dataset successfully generated!');
  console.log('   - 40+ Top grocery SKUs with live images and stock levels');
  console.log('   - Restock alerts: 4 Low-Stock items, 2 Out-of-Stock items');
  console.log('   - Active Inbound Receipts (Amul, ITC Foods, Tata Consumer)');
  console.log('   - Multi-location warehouse transfers (CFC Whitefield -> Dark Store)');
  console.log('   - Live storefront order fulfillment queue with 1-click Pack & Ship');
  console.log('   - Real stock deduction ledger');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
