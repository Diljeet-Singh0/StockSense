import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'products');
mkdirSync(outDir, { recursive: true });

const items = [
  ['milk', 'Amul Taaza', 'Toned Milk', '#e0f2fe', '#0369a1', '#ffffff', 'bottle'],
  ['milk-gold', 'Amul Gold', 'Full Cream', '#fef3c7', '#b45309', '#fffbeb', 'bottle'],
  ['curd', 'Mother Dairy', 'Classic Curd', '#f8fafc', '#0284c7', '#ffffff', 'tub'],
  ['butter', 'Amul', 'Butter 500g', '#fef9c3', '#ca8a04', '#fffbeb', 'pack'],
  ['eggs', 'Farm Fresh', '12 Eggs', '#fff7ed', '#c2410c', '#ffffff', 'eggs'],
  ['banana', 'Robusta', '1 Dozen', '#fef9c3', '#ca8a04', '#fefce8', 'fruit'],
  ['onion', 'Fresh', 'Onion 1 kg', '#fdf2f8', '#be185d', '#ffffff', 'veg'],
  ['tomato', 'Hybrid', 'Tomato 1 kg', '#fee2e2', '#dc2626', '#ffffff', 'veg'],
  ['potato', 'Fresh', 'Potato 1 kg', '#fef3c7', '#a16207', '#fffbeb', 'veg'],
  ['atta', 'Aashirvaad', 'Atta 5 kg', '#ffedd5', '#c2410c', '#fff7ed', 'sack'],
  ['rice', 'India Gate', 'Basmati 5 kg', '#f1f5f9', '#334155', '#ffffff', 'sack'],
  ['dal', 'Toor Dal', '1 kg', '#ffedd5', '#ea580c', '#fff7ed', 'sack'],
  ['oil', 'Fortune', 'Sunflower 1 L', '#fef9c3', '#a16207', '#fffbeb', 'bottle'],
  ['salt', 'Tata', 'Salt 1 kg', '#f8fafc', '#475569', '#ffffff', 'pack'],
  ['masala', 'MDH', 'Chana Masala', '#fee2e2', '#b91c1c', '#fff1f2', 'jar'],
  ['chips', "Lay's", 'Classic Salted', '#fef9c3', '#ca8a04', '#fffbeb', 'bag'],
  ['kurkure', 'Kurkure', 'Masala Munch', '#ffedd5', '#ea580c', '#fff7ed', 'bag'],
  ['bhujia', "Haldiram's", 'Aloo Bhujia', '#fef3c7', '#b45309', '#fffbeb', 'bag'],
  ['biscuits', 'Parle-G', 'Gold Biscuits', '#fef3c7', '#a16207', '#fffbeb', 'pack'],
  ['cola', 'Coca-Cola', '750 ml', '#fee2e2', '#b91c1c', '#ffffff', 'can'],
  ['thumsup', 'Thums Up', '750 ml', '#dcfce7', '#15803d', '#ffffff', 'can'],
  ['juice', 'Real', 'Mixed Fruit 1 L', '#ffedd5', '#ea580c', '#fff7ed', 'bottle'],
  ['water', 'Bisleri', 'Water 1 L', '#dbeafe', '#1d4ed8', '#ffffff', 'bottle'],
  ['noodles', 'Maggi', 'Masala 4-Pack', '#ffedd5', '#c2410c', '#fff7ed', 'pack'],
  ['paneer', 'MTR', 'Paneer Butter', '#fee2e2', '#be123c', '#fff1f2', 'pack'],
  ['coffee', 'Nescafe', 'Classic 100 g', '#f5f5f4', '#44403c', '#ffffff', 'jar'],
  ['tea', 'Tata Tea', 'Gold 500 g', '#dcfce7', '#166534', '#f0fdf4', 'pack'],
  ['soap', 'Dove', 'Beauty Bar x3', '#e0f2fe', '#0369a1', '#ffffff', 'pack'],
  ['toothpaste', 'Colgate', 'MaxFresh 150 g', '#cffafe', '#0e7490', '#ffffff', 'tube'],
  ['shampoo', 'Head & Shoulders', '340 ml', '#ede9fe', '#6d28d9', '#ffffff', 'bottle'],
  ['dishwash', 'Vim', 'Lemon Gel 750 ml', '#dcfce7', '#15803d', '#f0fdf4', 'bottle'],
  ['toilet', 'Harpic', 'Power Plus 1 L', '#dbeafe', '#1d4ed8', '#ffffff', 'bottle'],
  ['detergent', 'Surf Excel', 'Easy Wash 1.5 kg', '#e0f2fe', '#0284c7', '#ffffff', 'sack'],
  ['cheese', 'Amul', 'Cheese Slices', '#fef9c3', '#ca8a04', '#fffbeb', 'pack'],
  ['chocolate', 'Dairy Milk', 'Silk 150 g', '#f3e8ff', '#7e22ce', '#faf5ff', 'bar'],
];

function art(kind, accent) {
  if (kind === 'bottle') {
    return `<rect x="150" y="70" width="100" height="28" rx="8" fill="${accent}"/><rect x="130" y="98" width="140" height="210" rx="28" fill="${accent}" opacity="0.9"/><rect x="148" y="120" width="104" height="70" rx="8" fill="#fff" opacity="0.85"/>`;
  }
  if (kind === 'can') {
    return `<rect x="145" y="70" width="110" height="240" rx="18" fill="${accent}"/><rect x="145" y="110" width="110" height="46" fill="#fff" opacity="0.9"/><ellipse cx="200" cy="70" rx="55" ry="14" fill="${accent}"/>`;
  }
  if (kind === 'sack') {
    return `<path d="M120 120 Q200 70 280 120 L300 300 Q200 340 100 300 Z" fill="${accent}"/><rect x="150" y="160" width="100" height="54" rx="8" fill="#fff" opacity="0.88"/>`;
  }
  if (kind === 'bag') {
    return `<path d="M130 110 Q200 70 270 110 L285 300 Q200 330 115 300 Z" fill="${accent}"/><circle cx="200" cy="150" r="18" fill="#fff" opacity="0.8"/>`;
  }
  if (kind === 'eggs') {
    return `<ellipse cx="150" cy="180" rx="38" ry="50" fill="#fff" stroke="${accent}" stroke-width="8"/><ellipse cx="220" cy="175" rx="38" ry="50" fill="#fff" stroke="${accent}" stroke-width="8"/><ellipse cx="185" cy="245" rx="38" ry="50" fill="#fff" stroke="${accent}" stroke-width="8"/>`;
  }
  if (kind === 'fruit' || kind === 'veg') {
    return `<circle cx="165" cy="190" r="58" fill="${accent}"/><circle cx="235" cy="175" r="52" fill="${accent}" opacity="0.8"/><circle cx="205" cy="245" r="48" fill="${accent}" opacity="0.65"/>`;
  }
  if (kind === 'jar') {
    return `<rect x="155" y="70" width="90" height="24" rx="6" fill="${accent}"/><rect x="135" y="94" width="130" height="190" rx="18" fill="${accent}" opacity="0.85"/><rect x="150" y="120" width="100" height="40" fill="#fff" opacity="0.8"/>`;
  }
  if (kind === 'tube') {
    return `<rect x="155" y="80" width="90" height="200" rx="40" fill="${accent}"/><rect x="170" y="110" width="60" height="36" rx="6" fill="#fff"/>`;
  }
  if (kind === 'bar') {
    return `<rect x="110" y="130" width="180" height="120" rx="16" fill="${accent}"/><rect x="125" y="148" width="150" height="28" fill="#fff" opacity="0.85"/>`;
  }
  return `<rect x="120" y="100" width="160" height="190" rx="18" fill="${accent}"/><rect x="140" y="125" width="120" height="48" rx="8" fill="#fff" opacity="0.88"/>`;
}

for (const [file, brand, label, bg, accent, card, kind] of items) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="${bg}"/>
  <circle cx="640" cy="140" r="160" fill="${accent}" opacity="0.12"/>
  <circle cx="120" cy="680" r="180" fill="${accent}" opacity="0.1"/>
  <rect x="150" y="90" width="500" height="470" rx="40" fill="${card}"/>
  <g transform="translate(200,110)">${art(kind, accent)}</g>
  <text x="400" y="640" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#0f172a">${brand}</text>
  <text x="400" y="692" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#64748b">${label}</text>
</svg>`;
  writeFileSync(join(outDir, `${file}.svg`), svg);
}

writeFileSync(join(outDir, 'index.json'), JSON.stringify(items.map((i) => i[0])));
console.log(`wrote ${items.length}`);
