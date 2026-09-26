import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const day = 86400000;

const rules = {
  'DAIRY-AMUL-TM-500': { storageType: 'CHILLED', dailyDemand: 4, leadTimeDays: 5, costPrice: 22, barcode: '8901001000017' },
  'DAIRY-AMUL-GOLD-1L': { storageType: 'CHILLED', dailyDemand: 3, leadTimeDays: 5, costPrice: 54, barcode: '8901001000024' },
  'DAIRY-AMUL-BTR-500': { storageType: 'CHILLED', dailyDemand: 2, leadTimeDays: 4, costPrice: 230, barcode: '8901001000031' },
  'HH-SURF-EW-1.5': { storageType: 'AMBIENT', dailyDemand: 1, leadTimeDays: 6, costPrice: 160, barcode: '8901001000048' },
  'FRESH-TOMATO-1KG': { storageType: 'FRESH', dailyDemand: 8, leadTimeDays: 1, costPrice: 22, barcode: '8901001000055' },
};

async function main() {
  await prisma.location.updateMany({ where: { code: 'COLD-01' }, data: { storageType: 'CHILLED' } });
  await prisma.location.updateMany({ where: { code: 'FRESH-01' }, data: { storageType: 'FRESH' } });
  await prisma.location.updateMany({ where: { code: { in: ['DRY-01', 'SNK-01', 'PC-01', 'BULK-01'] } }, data: { storageType: 'AMBIENT' } });

  for (const [sku, rule] of Object.entries(rules)) {
    await prisma.product.update({ where: { sku }, data: rule });
  }

  const milk = await prisma.product.findUnique({ where: { sku: 'DAIRY-AMUL-TM-500' } });
  const cold = await prisma.location.findUnique({ where: { code: 'COLD-01' } });
  const hub = await prisma.location.findUnique({ where: { code: 'CFC-WH-02' } });
  const donor = await prisma.location.upsert({
    where: { code: 'COLD-02' },
    update: { storageType: 'CHILLED' },
    create: { name: 'Whitefield Cold Store', code: 'COLD-02', storageType: 'CHILLED', parentId: hub?.id },
  });
  if (milk && cold && donor) {
    await prisma.stockLevel.upsert({
      where: { productId_locationId: { productId: milk.id, locationId: donor.id } },
      update: { quantity: 40 },
      create: { productId: milk.id, locationId: donor.id, quantity: 40 },
    });
    await prisma.stockLevel.update({
      where: { productId_locationId: { productId: milk.id, locationId: cold.id } },
      data: { quantity: 12 },
    });
    const lots = [
      { lotCode: 'MILK-A', quantity: 8, expiresAt: new Date(Date.now() + 2 * day), locationId: cold.id },
      { lotCode: 'MILK-B', quantity: 4, expiresAt: new Date(Date.now() + 9 * day), locationId: cold.id },
      { lotCode: 'MILK-OLD', quantity: 2, expiresAt: new Date(Date.now() - day), locationId: cold.id, status: 'EXPIRED' },
    ];
    for (const lot of lots) {
      await prisma.stockBatch.upsert({
        where: { productId_locationId_lotCode: { productId: milk.id, locationId: lot.locationId, lotCode: lot.lotCode } },
        update: lot,
        create: { productId: milk.id, ...lot },
      });
    }
  }

  const tomato = await prisma.product.findUnique({ where: { sku: 'FRESH-TOMATO-1KG' } });
  const fresh = await prisma.location.findUnique({ where: { code: 'FRESH-01' } });
  if (tomato && fresh) {
    await prisma.stockBatch.upsert({
      where: { productId_locationId_lotCode: { productId: tomato.id, locationId: fresh.id, lotCode: 'TOM-SOON' } },
      update: { quantity: 20, expiresAt: new Date(Date.now() + 3 * day) },
      create: { productId: tomato.id, locationId: fresh.id, lotCode: 'TOM-SOON', quantity: 20, expiresAt: new Date(Date.now() + 3 * day) },
    });
  }
  console.log('planning demo ready');
}

main().finally(() => prisma.$disconnect());
