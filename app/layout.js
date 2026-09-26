import './globals.css';

export const metadata = {
  title: 'StockSense – Inventory Management System',
  description: 'Real-time inventory management with multi-warehouse support, stock tracking, receipts, deliveries, and full audit trail.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
