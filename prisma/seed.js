import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🛒 Seeding StockSense v2.0 — Blinkit-style Grocery Store + Inventory...');

  // Clean existing data (order matters for FK constraints)
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

  // ─── 1. Users ──────────────────────────────────────────────────────────────
  const adminHash = await bcryptjs.hash('admin123', 10);
  const manager = await prisma.user.create({
    data: {
      name: 'Diljeet Singh (Store Manager)',
      email: 'admin@stocksense.com',
      phone: '+91 98100 10001',
      passwordHash: adminHash,
      role: 'MANAGER',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Rohit (Warehouse Staff)',
      email: 'staff@stocksense.com',
      phone: '+91 98100 10002',
      passwordHash: adminHash,
      role: 'STAFF',
    },
  });

  const custHash = await bcryptjs.hash('customer123', 10);
  const customer = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'customer@example.com',
      phone: '+91 98765 43210',
      passwordHash: custHash,
      role: 'CUSTOMER',
    },
  });

  await prisma.address.create({
    data: {
      userId: customer.id,
      line1: 'Flat 402, Sunshine Apartments, 5th Cross Road',
      line2: 'Near Indiranagar Metro Station',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      isDefault: true,
    },
  });

  console.log('👥 Accounts created:');
  console.log('   Admin:    admin@stocksense.com / admin123');
  console.log('   Staff:    staff@stocksense.com / admin123');
  console.log('   Customer: customer@example.com / customer123');

  // ─── 2. Warehouse Locations ────────────────────────────────────────────────
  const darkStore = await prisma.location.create({
    data: { name: 'Dark Store — Indiranagar', code: 'DS-IND-01' },
  });
  const coldRoom = await prisma.location.create({
    data: { name: 'Cold Room (Dairy & Frozen)', code: 'COLD-01', parentId: darkStore.id },
  });
  const dryGoods = await prisma.location.create({
    data: { name: 'Dry Goods Aisle', code: 'DRY-01', parentId: darkStore.id },
  });
  const freshProduce = await prisma.location.create({
    data: { name: 'Fresh Produce Rack', code: 'FRESH-01', parentId: darkStore.id },
  });
  const personalCare = await prisma.location.create({
    data: { name: 'Personal Care & Household', code: 'PC-01', parentId: darkStore.id },
  });

  // ─── 3. Categories (Blinkit-style) ─────────────────────────────────────────
  const catDairy       = await prisma.category.create({ data: { name: 'Dairy & Eggs' } });
  const catFruits      = await prisma.category.create({ data: { name: 'Fruits & Vegetables' } });
  const catStaples     = await prisma.category.create({ data: { name: 'Atta, Rice & Dal' } });
  const catSnacks      = await prisma.category.create({ data: { name: 'Snacks & Munchies' } });
  const catBeverages   = await prisma.category.create({ data: { name: 'Cold Drinks & Juices' } });
  const catInstant     = await prisma.category.create({ data: { name: 'Instant & Ready to Eat' } });
  const catPersonal    = await prisma.category.create({ data: { name: 'Personal Care' } });
  const catHousehold   = await prisma.category.create({ data: { name: 'Cleaning & Household' } });

  // ─── 4. Suppliers ──────────────────────────────────────────────────────────
  const supAmul = await prisma.supplier.create({
    data: {
      name: 'Amul Dairy Cooperative',
      email: 'supply@amul.coop',
      phone: '+91 2692 258506',
      address: 'Amul Dairy Road, Anand, Gujarat 388001',
    },
  });
  await prisma.supplier.create({
    data: {
      name: 'ITC Foods Distribution',
      email: 'orders@itcfoods.com',
      phone: '+91 33 2288 9371',
      address: 'Virginia House, 37 J.L. Nehru Road, Kolkata 700071',
    },
  });
  await prisma.supplier.create({
    data: {
      name: 'Hindustan Unilever Supply Chain',
      email: 'distrib@hul.co.in',
      phone: '+91 22 3983 0000',
      address: 'Unilever House, B.D. Sawant Marg, Chakala, Mumbai 400099',
    },
  });

  // ─── 5. Products — Blinkit-style Grocery Catalog ───────────────────────────
  // Using publicly-hosted product images for a realistic feel

  const products = [
    // ── Dairy & Eggs ──
    {
      name: 'Amul Taaza Toned Milk',
      sku: 'DAIRY-AMUL-TM-500',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 27,
      reorderPoint: 50,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/390971a.jpg',
      isVisibleOnStore: true,
      description: 'Amul Taaza Homogenised Toned Milk — 500 ml pack. 3% fat, 8.5% SNF. Farm fresh taste delivered daily.',
      initialQty: 200,
      locationId: coldRoom.id,
    },
    {
      name: 'Amul Gold Full Cream Milk',
      sku: 'DAIRY-AMUL-GOLD-1L',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 68,
      reorderPoint: 30,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/390973a.jpg',
      isVisibleOnStore: true,
      description: 'Amul Gold Full Cream Milk — 1 litre pack. Rich and creamy with 6% fat.',
      initialQty: 120,
      locationId: coldRoom.id,
    },
    {
      name: 'Mother Dairy Classic Curd',
      sku: 'DAIRY-MD-CURD-400',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 40,
      reorderPoint: 25,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/351483a.jpg',
      isVisibleOnStore: true,
      description: 'Mother Dairy Classic Dahi — 400 g cup. Thick, creamy, and naturally set.',
      initialQty: 80,
      locationId: coldRoom.id,
    },
    {
      name: 'Amul Butter — 500g',
      sku: 'DAIRY-AMUL-BTR-500',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 270,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/32aborr.jpg',
      isVisibleOnStore: true,
      description: 'Amul Pasteurised Butter — 500 g carton. The taste of India.',
      initialQty: 45,
      locationId: coldRoom.id,
    },
    {
      name: 'Eggs — White (Pack of 12)',
      sku: 'DAIRY-EGGS-12',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 84,
      reorderPoint: 30,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/412133a.jpg',
      isVisibleOnStore: true,
      description: 'Farm fresh white eggs — tray of 12. Protein-rich, perfect for daily nutrition.',
      initialQty: 100,
      locationId: coldRoom.id,
    },

    // ── Fruits & Vegetables ──
    {
      name: 'Banana — Robusta (1 dozen)',
      sku: 'FRESH-BANANA-12',
      categoryId: catFruits.id,
      uom: 'pcs',
      price: 45,
      reorderPoint: 40,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/3702a.jpg',
      isVisibleOnStore: true,
      description: 'Fresh Robusta bananas — bunch of 12. Naturally ripened, rich in potassium.',
      initialQty: 150,
      locationId: freshProduce.id,
    },
    {
      name: 'Onion — 1 kg',
      sku: 'FRESH-ONION-1KG',
      categoryId: catFruits.id,
      uom: 'kg',
      price: 35,
      reorderPoint: 50,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/2702a.jpg',
      isVisibleOnStore: true,
      description: 'Fresh red onions — 1 kg. Essential kitchen staple for everyday Indian cooking.',
      initialQty: 200,
      locationId: freshProduce.id,
    },
    {
      name: 'Tomato — Hybrid (1 kg)',
      sku: 'FRESH-TOMATO-1KG',
      categoryId: catFruits.id,
      uom: 'kg',
      price: 30,
      reorderPoint: 50,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/2806a.jpg',
      isVisibleOnStore: true,
      description: 'Farm fresh hybrid tomatoes — 1 kg. Firm, red, and perfect for curries and salads.',
      initialQty: 180,
      locationId: freshProduce.id,
    },
    {
      name: 'Potato — 1 kg',
      sku: 'FRESH-POTATO-1KG',
      categoryId: catFruits.id,
      uom: 'kg',
      price: 28,
      reorderPoint: 60,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/2774a.jpg',
      isVisibleOnStore: true,
      description: 'Fresh potatoes — 1 kg. Clean, sorted, and ready to cook.',
      initialQty: 250,
      locationId: freshProduce.id,
    },

    // ── Atta, Rice & Dal ──
    {
      name: 'Aashirvaad Whole Wheat Atta — 5 kg',
      sku: 'STAPLE-ATTA-5KG',
      categoryId: catStaples.id,
      uom: 'pcs',
      price: 269,
      reorderPoint: 20,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23902a.jpg',
      isVisibleOnStore: true,
      description: 'Aashirvaad Superior MP Whole Wheat Atta — 5 kg. 0% Maida. Soft rotis guaranteed.',
      initialQty: 60,
      locationId: dryGoods.id,
    },
    {
      name: 'India Gate Basmati Rice — Classic — 5 kg',
      sku: 'STAPLE-RICE-IG-5KG',
      categoryId: catStaples.id,
      uom: 'pcs',
      price: 429,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/271080a.jpg',
      isVisibleOnStore: true,
      description: 'India Gate Classic Basmati Rice — 5 kg. Aged, aromatic long grain. The king of rice.',
      initialQty: 40,
      locationId: dryGoods.id,
    },
    {
      name: 'Toor Dal (Arhar) — 1 kg',
      sku: 'STAPLE-TOOR-1KG',
      categoryId: catStaples.id,
      uom: 'pcs',
      price: 155,
      reorderPoint: 25,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/195466a.jpg',
      isVisibleOnStore: true,
      description: 'Premium unpolished Toor Dal — 1 kg. Rich protein, quick cooking, daily essential.',
      initialQty: 75,
      locationId: dryGoods.id,
    },
    {
      name: 'Fortune Sunflower Oil — 1 L',
      sku: 'STAPLE-OIL-SF-1L',
      categoryId: catStaples.id,
      uom: 'pcs',
      price: 135,
      reorderPoint: 20,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/25082a.jpg',
      isVisibleOnStore: true,
      description: 'Fortune Sunlite Refined Sunflower Oil — 1 litre pouch. Light, healthy cooking oil.',
      initialQty: 90,
      locationId: dryGoods.id,
    },
    {
      name: 'Tata Salt — 1 kg',
      sku: 'STAPLE-SALT-1KG',
      categoryId: catStaples.id,
      uom: 'pcs',
      price: 28,
      reorderPoint: 30,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/22024a.jpg',
      isVisibleOnStore: true,
      description: 'Tata Salt Vacuum Evaporated Iodised Salt — 1 kg. Desh ka namak.',
      initialQty: 150,
      locationId: dryGoods.id,
    },
    {
      name: 'MDH Chana Masala — 100 g',
      sku: 'STAPLE-MDH-CM-100',
      categoryId: catStaples.id,
      uom: 'pcs',
      price: 72,
      reorderPoint: 20,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/26397a.jpg',
      isVisibleOnStore: true,
      description: 'MDH Chana Masala Powder — 100 g box. Authentic blend for chole and chickpea curries.',
      initialQty: 65,
      locationId: dryGoods.id,
    },

    // ── Snacks & Munchies ──
    {
      name: 'Lay\'s Classic Salted Chips — 52 g',
      sku: 'SNACK-LAYS-CS-52',
      categoryId: catSnacks.id,
      uom: 'pcs',
      price: 20,
      reorderPoint: 40,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/4828a.jpg',
      isVisibleOnStore: true,
      description: 'Lay\'s Classic Salted Potato Chips — 52 g pack. Crispy, crunchy, irresistible.',
      initialQty: 200,
      locationId: dryGoods.id,
    },
    {
      name: 'Kurkure Masala Munch — 94 g',
      sku: 'SNACK-KURK-MM-94',
      categoryId: catSnacks.id,
      uom: 'pcs',
      price: 20,
      reorderPoint: 40,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/4770a.jpg',
      isVisibleOnStore: true,
      description: 'Kurkure Masala Munch Crisps — 94 g. India\'s favourite masti snack!',
      initialQty: 180,
      locationId: dryGoods.id,
    },
    {
      name: 'Haldiram\'s Aloo Bhujia — 200 g',
      sku: 'SNACK-HALD-AB-200',
      categoryId: catSnacks.id,
      uom: 'pcs',
      price: 62,
      reorderPoint: 25,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/4692a.jpg',
      isVisibleOnStore: true,
      description: 'Haldiram\'s Aloo Bhujia — 200 g pack. Classic Indian namkeen, perfect tea-time snack.',
      initialQty: 100,
      locationId: dryGoods.id,
    },
    {
      name: 'Parle-G Gold Biscuits — 100 g',
      sku: 'SNACK-PARLE-G-100',
      categoryId: catSnacks.id,
      uom: 'pcs',
      price: 25,
      reorderPoint: 50,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/277979a.jpg',
      isVisibleOnStore: true,
      description: 'Parle-G Gold Biscuits — 100 g. India\'s most loved biscuit, enriched with goodness.',
      initialQty: 250,
      locationId: dryGoods.id,
    },

    // ── Cold Drinks & Juices ──
    {
      name: 'Coca-Cola — 750 ml',
      sku: 'BEV-COKE-750',
      categoryId: catBeverages.id,
      uom: 'pcs',
      price: 38,
      reorderPoint: 30,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/6100a.jpg',
      isVisibleOnStore: true,
      description: 'Coca-Cola Original Taste — 750 ml bottle. Refreshing & fizzy. Serve chilled.',
      initialQty: 120,
      locationId: coldRoom.id,
    },
    {
      name: 'Thums Up — 750 ml',
      sku: 'BEV-TU-750',
      categoryId: catBeverages.id,
      uom: 'pcs',
      price: 38,
      reorderPoint: 30,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/392389a.jpg',
      isVisibleOnStore: true,
      description: 'Thums Up — 750 ml bottle. Toofani taste. India\'s thunder drink.',
      initialQty: 110,
      locationId: coldRoom.id,
    },
    {
      name: 'Real Fruit Power Mixed Fruit — 1 L',
      sku: 'BEV-REAL-MF-1L',
      categoryId: catBeverages.id,
      uom: 'pcs',
      price: 99,
      reorderPoint: 20,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/6219a.jpg',
      isVisibleOnStore: true,
      description: 'Real Fruit Power Mixed Fruit Juice — 1 litre Tetra Pack. No added preservatives.',
      initialQty: 75,
      locationId: coldRoom.id,
    },
    {
      name: 'Bisleri Water — 1 L (Pack of 12)',
      sku: 'BEV-BISL-1L-12',
      categoryId: catBeverages.id,
      uom: 'pcs',
      price: 240,
      reorderPoint: 10,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/296386a.jpg',
      isVisibleOnStore: true,
      description: 'Bisleri Mineral Water — 1 litre bottle x 12 pack. Pure, safe drinking water.',
      initialQty: 50,
      locationId: dryGoods.id,
    },

    // ── Instant & Ready to Eat ──
    {
      name: 'Maggi 2-Minute Masala Noodles — 280 g (4-Pack)',
      sku: 'INST-MAGGI-4PK',
      categoryId: catInstant.id,
      uom: 'pcs',
      price: 56,
      reorderPoint: 40,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/31498a.jpg',
      isVisibleOnStore: true,
      description: 'Maggi 2-Minute Instant Noodles Masala — 4 pack (70 g × 4). India\'s favourite comfort food.',
      initialQty: 160,
      locationId: dryGoods.id,
    },
    {
      name: 'MTR Ready to Eat Paneer Butter Masala — 300 g',
      sku: 'INST-MTR-PBM-300',
      categoryId: catInstant.id,
      uom: 'pcs',
      price: 115,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/191051a.jpg',
      isVisibleOnStore: true,
      description: 'MTR Ready to Eat Paneer Butter Masala — 300 g pack. Heat and eat in 3 minutes.',
      initialQty: 40,
      locationId: dryGoods.id,
    },
    {
      name: 'Nescafé Classic Coffee — 100 g',
      sku: 'INST-NESCAFE-100',
      categoryId: catInstant.id,
      uom: 'pcs',
      price: 260,
      reorderPoint: 10,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/21735a.jpg',
      isVisibleOnStore: true,
      description: 'Nescafé Classic Instant Coffee Powder — 100 g jar. 100% pure coffee, rich aroma.',
      initialQty: 55,
      locationId: dryGoods.id,
    },
    {
      name: 'Tata Tea Gold — 500 g',
      sku: 'INST-TATA-TEA-500',
      categoryId: catInstant.id,
      uom: 'pcs',
      price: 280,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/21667a.jpg',
      isVisibleOnStore: true,
      description: 'Tata Tea Gold — 500 g pack. 15% long leaves for a richer, aromatic chai.',
      initialQty: 70,
      locationId: dryGoods.id,
    },

    // ── Personal Care ──
    {
      name: 'Dove Cream Beauty Bar — 125 g (Pack of 3)',
      sku: 'PC-DOVE-BAR-3PK',
      categoryId: catPersonal.id,
      uom: 'pcs',
      price: 195,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/32218a.jpg',
      isVisibleOnStore: true,
      description: 'Dove Cream Beauty Bathing Bar — 125 g × 3 pack. With ¼ moisturizing cream.',
      initialQty: 50,
      locationId: personalCare.id,
    },
    {
      name: 'Colgate MaxFresh Toothpaste — 150 g',
      sku: 'PC-COLG-MF-150',
      categoryId: catPersonal.id,
      uom: 'pcs',
      price: 105,
      reorderPoint: 20,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/31908a.jpg',
      isVisibleOnStore: true,
      description: 'Colgate MaxFresh Blue Gel Toothpaste — 150 g. Cooling crystals for fresh breath.',
      initialQty: 85,
      locationId: personalCare.id,
    },
    {
      name: 'Head & Shoulders Anti-Dandruff Shampoo — 340 ml',
      sku: 'PC-HNS-AD-340',
      categoryId: catPersonal.id,
      uom: 'pcs',
      price: 330,
      reorderPoint: 10,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/32302a.jpg',
      isVisibleOnStore: true,
      description: 'Head & Shoulders Smooth & Silky Anti-Dandruff Shampoo — 340 ml. Clinically proven.',
      initialQty: 35,
      locationId: personalCare.id,
    },

    // ── Cleaning & Household ──
    {
      name: 'Vim Dishwash Gel Lemon — 750 ml',
      sku: 'HH-VIM-GEL-750',
      categoryId: catHousehold.id,
      uom: 'pcs',
      price: 120,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/21218a.jpg',
      isVisibleOnStore: true,
      description: 'Vim Dishwash Lemon Gel — 750 ml bottle. 100x grease cleaning power.',
      initialQty: 60,
      locationId: personalCare.id,
    },
    {
      name: 'Harpic Power Plus Toilet Cleaner — 1 L',
      sku: 'HH-HARP-PP-1L',
      categoryId: catHousehold.id,
      uom: 'pcs',
      price: 155,
      reorderPoint: 12,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/31367a.jpg',
      isVisibleOnStore: true,
      description: 'Harpic Power Plus Original Toilet Cleaner — 1 litre. 10x better stain removal.',
      initialQty: 45,
      locationId: personalCare.id,
    },
    {
      name: 'Surf Excel Easy Wash Detergent — 1.5 kg',
      sku: 'HH-SURF-EW-1.5',
      categoryId: catHousehold.id,
      uom: 'pcs',
      price: 195,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/20898a.jpg',
      isVisibleOnStore: true,
      description: 'Surf Excel Easy Wash Detergent Powder — 1.5 kg. Tough stain removal, suitable for hand and machine wash.',
      initialQty: 55,
      locationId: personalCare.id,
    },

    // ── LOW STOCK example ──
    {
      name: 'Amul Cheese Slices — 200 g (10 Slices)',
      sku: 'DAIRY-AMUL-CS-200',
      categoryId: catDairy.id,
      uom: 'pcs',
      price: 120,
      reorderPoint: 20, // LOW STOCK: 5 <= 20
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/24527a.jpg',
      isVisibleOnStore: true,
      description: 'Amul Processed Cheese Slices — 200 g (10 slices). Perfect for sandwiches, burgers, and pizza.',
      initialQty: 5,
      locationId: coldRoom.id,
    },

    // ── OUT OF STOCK example ──
    {
      name: 'Cadbury Dairy Milk Silk — 150 g',
      sku: 'SNACK-CDM-SILK-150',
      categoryId: catSnacks.id,
      uom: 'pcs',
      price: 175,
      reorderPoint: 15,
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/410489a.jpg',
      isVisibleOnStore: true,
      description: 'Cadbury Dairy Milk Silk Chocolate Bar — 150 g. Smoother, creamier, silkier.',
      initialQty: 0,
      locationId: dryGoods.id,
    },
  ];

  for (const item of products) {
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
          referenceType: 'initial_stock',
          createdBy: manager.id,
        },
      });
    }
  }

  console.log(`📦 Seeded ${products.length} grocery products across ${8} categories`);

  // ─── 6. Sample Receipt (Dairy restock from Amul) ───────────────────────────
  const milkProduct = await prisma.product.findUnique({ where: { sku: 'DAIRY-AMUL-TM-500' } });
  await prisma.receipt.create({
    data: {
      reference: 'REC-202609-0001',
      supplierId: supAmul.id,
      locationId: coldRoom.id,
      status: 'READY',
      notes: 'Daily morning dairy restock — Amul milk & curd',
      createdBy: manager.id,
      lines: {
        create: [{ productId: milkProduct.id, quantity: 100, uom: 'pcs' }],
      },
    },
  });

  // ─── 7. Sample Customer Order (COD) ────────────────────────────────────────
  const attaProduct = await prisma.product.findUnique({ where: { sku: 'STAPLE-ATTA-5KG' } });
  const maggiProduct = await prisma.product.findUnique({ where: { sku: 'INST-MAGGI-4PK' } });
  const cokeProduct = await prisma.product.findUnique({ where: { sku: 'BEV-COKE-750' } });

  const orderNum = 'ORD-202609-5521';
  const shippingAddr = {
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    line1: 'Flat 402, Sunshine Apartments, 5th Cross Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
  };

  const sampleOrder = await prisma.customerOrder.create({
    data: {
      orderNumber: orderNum,
      customerId: customer.id,
      status: 'CONFIRMED',
      totalAmount: 269 + 56 + 38,
      paymentMethod: 'COD',
      customerPhone: '+91 98765 43210',
      shippingAddress: shippingAddr,
      notes: 'Please deliver before 7 PM',
      lines: {
        create: [
          { productId: attaProduct.id, quantity: 1, unitPrice: 269, total: 269 },
          { productId: maggiProduct.id, quantity: 1, unitPrice: 56, total: 56 },
          { productId: cokeProduct.id, quantity: 1, unitPrice: 38, total: 38 },
        ],
      },
    },
  });

  await prisma.deliveryOrder.create({
    data: {
      reference: `DEL-${orderNum}`,
      customerName: 'Priya Sharma (COD Order)',
      locationId: darkStore.id,
      status: 'READY',
      source: 'CUSTOMER_ORDER',
      customerOrderId: sampleOrder.id,
      notes: `Auto-created from storefront order ${orderNum}. COD ₹363. Deliver to Indiranagar.`,
      createdBy: manager.id,
      lines: {
        create: [
          { productId: attaProduct.id, quantity: 1 },
          { productId: maggiProduct.id, quantity: 1 },
          { productId: cokeProduct.id, quantity: 1 },
        ],
      },
    },
  });

  console.log('✅ Seeding complete!');
  console.log('   → Customer Store: http://localhost:3000');
  console.log('   → Admin Panel:    http://localhost:3000/login');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
