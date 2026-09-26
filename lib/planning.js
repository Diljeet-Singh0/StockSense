const STORAGE_OK = {
  CHILLED: ['CHILLED', 'FROZEN'],
  FROZEN: ['FROZEN'],
  FRESH: ['FRESH', 'CHILLED'],
  AMBIENT: ['AMBIENT'],
};

export function storageFits(productType, locationType) {
  return (STORAGE_OK[productType] || STORAGE_OK.AMBIENT).includes(locationType || 'AMBIENT');
}

export function daysCover(onHand, dailyDemand) {
  if (!dailyDemand || dailyDemand <= 0) return null;
  return Math.round((onHand / dailyDemand) * 10) / 10;
}

export function planLine({
  product,
  levels,
  openTransfers = [],
  openReceipts = [],
  demandMultiplier = 1,
  leadTimeExtra = 0,
  unavailableLocationIds = [],
}) {
  const demand = Math.max(0, Number(product.dailyDemand || 0) * demandMultiplier);
  const lead = Math.max(1, Number(product.leadTimeDays || 5) + leadTimeExtra);
  const coverDays = lead + 2;
  const target = demand > 0 ? Math.ceil(demand * coverDays) : Math.max(Number(product.reorderPoint) * 2, 0);
  const reorderPoint = Number(product.reorderPoint || 0);
  const localKeep = demand > 0 ? Math.ceil(demand * 2) : Math.ceil(reorderPoint * 0.25);
  const networkKeep = Math.max(reorderPoint, localKeep);
  const productType = product.storageType || 'AMBIENT';
  const suitable = levels.filter((level) => !unavailableLocationIds.includes(level.locationId) && storageFits(productType, level.storageType));
  const blocked = levels
    .filter((level) => !storageFits(productType, level.storageType) && Number(level.quantity) > 0)
    .map((level) => `${level.location} holds ${level.quantity} but storage ${level.storageType} is not suitable for ${productType}`);

  const incomingByLocation = {};
  for (const transfer of openTransfers) {
    if (transfer.productId !== product.id || ['DONE', 'CANCELED'].includes(transfer.status)) continue;
    incomingByLocation[transfer.destLocationId] = (incomingByLocation[transfer.destLocationId] || 0) + Number(transfer.quantity);
  }
  for (const receipt of openReceipts) {
    if (receipt.productId !== product.id || ['DONE', 'CANCELED'].includes(receipt.status)) continue;
    incomingByLocation[receipt.locationId] = (incomingByLocation[receipt.locationId] || 0) + Number(receipt.quantity);
  }

  const shortages = suitable.flatMap((level) => {
    const onHand = Number(level.quantity);
    const incoming = incomingByLocation[level.locationId] || 0;
    const shortfall = Math.max(0, target - onHand - incoming);
    const cover = daysCover(onHand, demand);
    if (shortfall <= 0) return [];
    return [{ ...level, onHand, incoming, coverDays: cover, target, shortfall }];
  });

  const donors = suitable.map((level) => {
    const keep = Number(level.quantity) >= networkKeep ? networkKeep : localKeep;
    return { ...level, keep, spare: Math.max(0, Number(level.quantity) - keep) };
  }).filter((level) => level.spare >= 1).sort((a, b) => b.spare - a.spare);

  const actions = [];
  for (const shortage of shortages) {
    let remaining = shortage.shortfall;
    for (const donor of donors) {
      if (donor.locationId === shortage.locationId || donor.spare < 1) continue;
      const already = openTransfers.some((item) => item.productId === product.id && item.sourceLocationId === donor.locationId && item.destLocationId === shortage.locationId && !['DONE', 'CANCELED'].includes(item.status));
      if (already) continue;
      const quantity = Math.min(remaining, donor.spare);
      donor.spare -= quantity;
      remaining -= quantity;
      actions.push({
        action: 'TRANSFER',
        productId: product.id,
        product: product.name,
        sku: product.sku,
        uom: product.uom,
        fromId: donor.locationId,
        from: donor.location,
        toId: shortage.locationId,
        to: shortage.location,
        quantity,
        reason: `${shortage.location} has ${shortage.onHand} on hand, about ${shortage.coverDays ?? 'unknown'} days. ${donor.location} can spare ${quantity} and still keep ${donor.keep}. Transfer is same-day; supplier lead time is ${lead} days.`,
        assumptions: [
          `Configured demand ${demand || 'not set'} times ${coverDays} cover days gives target ${target}.`,
          `Donor keeps ${donor.keep}. A location already above the reorder point keeps the full reorder point.`,
          `Storage ${productType} is allowed at both locations.`,
          'This creates a draft only. Stock does not move until the transfer is executed.',
        ],
      });
      if (remaining <= 0) break;
    }
    if (remaining > 0) {
      const sellingPrice = Number(product.price || 0);
      const cost = product.costPrice == null ? null : Number(product.costPrice);
      actions.push({
        action: 'BUY',
        productId: product.id,
        product: product.name,
        sku: product.sku,
        uom: product.uom,
        toId: shortage.locationId,
        to: shortage.location,
        quantity: remaining,
        leadTimeDays: lead,
        coverDays: shortage.coverDays,
        onHand: shortage.onHand,
        incoming: shortage.incoming,
        sellingPrice,
        costPrice: cost,
        estimateLabel: cost == null ? 'Selling price times quantity, not a verified buying cost' : 'Configured cost price times quantity',
        estimatedAmount: (cost ?? sellingPrice) * remaining,
        reason: `Remaining gap is ${remaining}. On hand ${shortage.onHand}, incoming ${shortage.incoming}, target ${shortage.target}, supplier lead time ${lead} days.`,
        assumptions: [
          demand > 0 ? 'Demand is a configured daily rate, not a forecast model.' : 'No daily demand is configured, so the reorder-point rule is used.',
          'Open receipts and open transfers are already counted as incoming.',
          cost == null ? 'No supplier cost is stored, so the amount uses selling price.' : 'Amount uses the stored cost price.',
        ],
      });
    }
  }

  return { productId: product.id, product: product.name, sku: product.sku, storageType: productType, demand, leadTimeDays: lead, target, blocked, actions };
}
