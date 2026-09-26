import './globals.css';

export const metadata = {
  title: 'StockSense — Groceries in minutes',
  description: 'Quick-commerce grocery store with live warehouse inventory, cash on delivery, and a staff operations desk.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
