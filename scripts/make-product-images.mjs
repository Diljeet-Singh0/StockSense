import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'products');
mkdirSync(outDir, { recursive: true });

const items = [
  ['milk', 'Milk', '#f8fafc', '#0f766e', '🥛'],
  ['milk-gold', 'Full Cream', '#fff7ed', '#c2410c', '🥛'],
  ['curd', 'Curd', '#f8fafc', '#0369a1', '🥣'],
  ['butter', 'Butter', '#fef3c7', '#b45309', '🧈'],
  ['eggs', 'Eggs', '#fffbeb', '#a16207', '🥚'],
  ['banana', 'Banana', '#fef9c3', '#ca8a04', '🍌'],
  ['onion', 'Onion', '#fdf2f8', '#be185d', '🧅'],
  ['tomato', 'Tomato', '#fef2f2', '#dc2626', '🍅'],
  ['potato', 'Potato', '#fefce8', '#a16207', '🥔'],
  ['atta', 'Atta', '#fef3c7', '#92400e', '🌾'],
  ['rice', 'Rice', '#f8fafc', '#475569', '🍚'],
  ['dal', 'Dal', '#fff7ed', '#c2410c', '🫘'],
  ['oil', 'Oil', '#fefce8', '#a16207', '🫒'],
  ['salt', 'Salt', '#f8fafc', '#64748b', '🧂'],
  ['masala', 'Masala', '#fff1f2', '#be123c', '🌶️'],
  ['chips', 'Chips', '#fef9c3', '#ca8a04', '🍟'],
  ['kurkure', 'Snacks', '#fff7ed', '#ea580c', '🌽'],
  ['bhujia', 'Bhujia', '#fef3c7', '#b45309', '🥨'],
  ['biscuits', 'Biscuits', '#fffbeb', '#a16207', '🍪'],
  ['cola', 'Cola', '#fef2f2', '#b91c1c', '🥤'],
  ['thumsup', 'Soda', '#f0fdf4', '#15803d', '🥤'],
  ['juice', 'Juice', '#fff7ed', '#ea580c', '🧃'],
  ['water', 'Water', '#eff6ff', '#2563eb', '💧'],
  ['noodles', 'Noodles', '#fff7ed', '#c2410c', '🍜'],
  ['paneer', 'Ready Meal', '#fef2f2', '#be123c', '🍛'],
  ['coffee', 'Coffee', '#f5f5f4', '#44403c', '☕'],
  ['tea', 'Tea', '#f0fdf4', '#166534', '🍵'],
  ['soap', 'Soap', '#f0f9ff', '#0369a1', '🧼'],
  ['toothpaste', 'Toothpaste', '#ecfeff', '#0e7490', '🦷'],
  ['shampoo', 'Shampoo', '#f5f3ff', '#6d28d9', '🧴'],
  ['dishwash', 'Dishwash', '#f0fdf4', '#15803d', '🍋'],
  ['toilet', 'Cleaner', '#eff6ff', '#1d4ed8', '🧴'],
  ['detergent', 'Detergent', '#f0f9ff', '#0284c7', '🧺'],
  ['cheese', 'Cheese', '#fef9c3', '#ca8a04', '🧀'],
  ['chocolate', 'Chocolate', '#faf5ff', '#7e22ce', '🍫'],
];

for (const [file, label, bg, accent] of items) {
  const canvas = createCanvas(800, 800);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 800, 800);

  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(620, 160, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(140, 680, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 170, 150, 460, 500, 48);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.fillRect(230, 210, 340, 18);
  ctx.globalAlpha = 0.25;
  ctx.fillRect(250, 270, 300, 220);
  ctx.globalAlpha = 1;
  ctx.fillRect(250, 530, 180, 28);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 400, 720);

  writeFileSync(join(outDir, `${file}.jpg`), canvas.toBuffer('image/jpeg', { quality: 0.9 }));
  console.log(file);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
