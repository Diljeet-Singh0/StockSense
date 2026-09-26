'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const moveTypeLabels = {
  RECEIPT: { label: 'Receipt In', class: 'badge-done' },
  DELIVERY: { label: 'Delivery Out', class: 'badge-canceled' },
  TRANSFER_IN: { label: 'Transfer In', class: 'badge-ready' },
  TRANSFER_OUT: { label: 'Transfer Out', class: 'badge-waiting' },
  ADJUSTMENT: { label: 'Audit Adjustment', class: 'badge-draft' },
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Operations Control</h1>
          <p className="text-slate-500 mt-1">Aggregating live warehouse and fulfillment telemetry...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const recentMoves = data?.recentMoves || [];
  const lowStockList = data?.lowStockList || [];
  const pendingOrders = data?.pendingOrders || [];
  const locations = data?.locations || [];

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-7xl">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Warehouse Operations Center</h1>
            <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active System
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Real-time multi-location inventory tracking, inbound receipts, and quick-commerce order dispatch
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Link
            href="/receipts"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-800/20 transition-all active:scale-95"
          >
            <span>📥</span>
            <span>Receive Stock</span>
          </Link>
          <Link
            href="/deliveries"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <span>📤</span>
            <span>Dispatch / Deliver</span>
          </Link>
          <Link
            href="/transfers"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <span>🔄</span>
            <span>Internal Transfer</span>
          </Link>
          <Link
            href="/adjustments"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <span>⚖️</span>
            <span>Stock Count</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKUs */}
        <Link
          href="/products"
          className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalog SKUs</span>
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg font-bold">
              📦
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3 group-hover:text-emerald-700 transition-colors">
            {kpis.totalProducts ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Managed product lines</p>
        </Link>

        {/* Total Stock Asset Valuation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Valuation</span>
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
              💰
            </span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 mt-3">
            ₹{Number(kpis.totalValuation || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Estimated on-hand asset worth</p>
        </div>

        {/* Store Customer Orders Needing Fulfillment */}
        <Link
          href="/deliveries?source=CUSTOMER_ORDER"
          className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group relative overflow-hidden"
        >
          {kpis.pendingCustomerOrders > 0 && (
            <span className="absolute top-3 right-3 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store Orders (COD)</span>
            <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg font-bold">
              🛒
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3 group-hover:text-emerald-600 transition-colors">
            {kpis.pendingCustomerOrders ?? 0}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Orders awaiting warehouse dispatch →</p>
        </Link>

        {/* Stock Alerts (Low & Out of Stock) */}
        <Link
          href="/products?filter=low"
          className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Restock Alerts</span>
            <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
              ⚠️
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-3xl font-extrabold text-amber-600">{kpis.lowStock ?? 0}</p>
            <span className="text-xs font-bold text-slate-400">Low</span>
            <span className="text-slate-300">/</span>
            <p className="text-xl font-bold text-rose-600">{kpis.outOfStock ?? 0}</p>
            <span className="text-xs font-bold text-slate-400">Out</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Action required before stockout</p>
        </Link>
      </div>

      {/* Operational Split: Critical Reorder Table & Live Order Dispatch Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Low Stock Alert Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">Restock Attention Needed</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                {lowStockList.length} Items
              </span>
            </div>
            <Link href="/products?filter=low" className="text-xs text-emerald-700 hover:text-emerald-900 font-bold">
              View All →
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {lowStockList.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <span className="text-3xl mb-2 inline-block">✅</span>
                <p className="font-semibold text-slate-800">All inventory levels healthy</p>
                <p className="text-xs text-slate-400 mt-1">No items currently below minimum safety thresholds</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="px-6 py-3 font-semibold">SKU / Item</th>
                    <th className="px-4 py-3 font-semibold text-right">Available</th>
                    <th className="px-4 py-3 font-semibold text-right">Min Threshold</th>
                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {lowStockList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              📦
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 truncate max-w-[160px]">{item.name}</p>
                            <p className="text-[11px] font-mono text-slate-400">{item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${item.totalStock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                          {item.totalStock} {item.uom}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 font-medium">
                        {item.reorderPoint} {item.uom}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href={`/receipts?productId=${item.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          + Receive
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Live Store Orders Fulfillment Queue */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">Live Storefront Orders (COD)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
                {pendingOrders.length} Pending
              </span>
            </div>
            <Link href="/deliveries?source=CUSTOMER_ORDER" className="text-xs text-indigo-600 hover:text-indigo-800 font-bold">
              Dispatch Center →
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <span className="text-3xl mb-2 inline-block">🛒</span>
                <p className="font-semibold text-slate-800">No pending store orders</p>
                <p className="text-xs text-slate-400 mt-1">Orders placed on the customer storefront show up here automatically</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="p-4 px-6 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{order.orderNumber}</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        <span className="font-medium text-slate-800">{order.customerName}</span> • {order.itemCount} items
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-xs font-black text-slate-900">₹{order.totalAmount.toFixed(2)}</p>
                        <p className="text-[10px] text-emerald-600 font-bold">Cash on Delivery</p>
                      </div>
                      <Link
                        href="/deliveries?source=CUSTOMER_ORDER"
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                      >
                        Pack & Ship
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Hubs Summary & Recent Moves Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Storage Hubs */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Warehouse Nodes</h2>
            <Link href="/warehouses" className="text-xs text-indigo-600 hover:text-indigo-800 font-bold">
              Manage →
            </Link>
          </div>

          <div className="space-y-3">
            {locations.length === 0 ? (
              <p className="text-xs text-slate-400">No warehouse locations configured</p>
            ) : (
              locations.map((loc) => (
                <div key={loc.id} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      🏢
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{loc.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">{loc.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{loc.totalUnits} Units</p>
                    <p className="text-[10px] text-slate-500">{loc.itemCount} SKUs</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Stock Movement Ledger */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Stock Ledger Activity</h2>
              <p className="text-xs text-slate-400">Immutable trace of additions, dispatches, and transfers</p>
            </div>
            <Link href="/history" className="text-xs text-indigo-600 hover:text-indigo-700 font-bold">
              Full Audit Ledger →
            </Link>
          </div>

          {recentMoves.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              <span className="text-3xl mb-2 inline-block">📋</span>
              <p className="text-sm font-semibold">No stock movements recorded</p>
              <p className="text-xs text-slate-400 mt-1">Inbound receipts or delivery orders will create entries here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Product</th>
                    <th className="px-4 py-3">Warehouse Hub</th>
                    <th className="px-4 py-3">Operation</th>
                    <th className="px-4 py-3 text-right">Delta</th>
                    <th className="px-6 py-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentMoves.map((move) => {
                    const qty = parseFloat(move.quantityChange);
                    const typeInfo = moveTypeLabels[move.moveType] || { label: move.moveType, class: 'badge-draft' };
                    return (
                      <tr key={move.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <p className="font-bold text-slate-900">{move.product.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{move.product.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{move.location.name}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${typeInfo.class}`}>{typeInfo.label}</span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            qty > 0 ? 'text-emerald-600' : qty < 0 ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          {qty > 0 ? `+${qty}` : qty}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-400">
                          {new Date(move.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
