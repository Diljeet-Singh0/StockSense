# StockSense Hackathon Demo

## 60-second pitch

StockSense replaces Excel sheets and manual stock registers with a real-time, multi-warehouse inventory control tower. Every receipt, delivery, transfer, and physical count updates stock and an immutable ledger in one database transaction.

## Demo logins

- Manager: `admin@stocksense.com` / `admin123`
- Staff: `staff@stocksense.com` / `admin123`
- Customer: `customer@example.com` / `customer123`

## 4-minute live flow

1. Open `/dashboard`. Show in-stock SKUs, low stock, valuation, and filters.
2. Open `/suggestions`. Show cheese and chocolate reorder quantities and estimated cost.
3. Click Receive, create a receipt, then Validate. Show stock increase.
4. Open `/transfers`, create a transfer, then Execute. Show source down and destination up.
5. Open `/history`. Show the ledger entries and export CSV.
6. Open `/` as a customer, add an item, and place a COD order.
7. Return to `/deliveries` and show the order in the warehouse queue.

## Judging points to say out loud

- Multi-location stock, not a single quantity column.
- Document lifecycle: Draft, Ready, Done, Canceled.
- Purchase suggestions from reorder points.
- Physical inventory adjustment with variance.
- Immutable stock move history.
- Role-based access for manager, staff, and customer.
