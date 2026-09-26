'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, authChecked, requireAuth } = useCart();

  // Gate: must be logged in to view orders
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      requireAuth();
    }
  }, [authChecked, isAuthenticated, requireAuth]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated) return;
    fetch('/api/customer/orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authChecked, isAuthenticated]);

  const statusStyles = {
    PLACED: { label: 'Order Placed • Picking Soon', class: 'bg-amber-50 text-amber-800 border-amber-200' },
    CONFIRMED: { label: 'Packed & Verified in Warehouse', class: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    OUT_FOR_DELIVERY: { label: '⚡ Out for Express Delivery', class: 'bg-blue-50 text-blue-800 border-blue-200' },
    DELIVERED: { label: '✓ Delivered & Paid', class: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    CANCELED: { label: 'Canceled', class: 'bg-rose-50 text-rose-800 border-rose-200' },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Order History & Tracking</h1>
          <p className="text-xs text-slate-500 mt-1">Live fulfillment updates from Indiranagar Warehouse Hub #1</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-2xl shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto active:scale-95"
        >
          <span>+ Shop Fresh Items</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-20 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full" />
          <p className="text-xs text-slate-400 mt-2 font-medium">Fetching orders from warehouse...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="text-5xl">📦</div>
          <h2 className="text-lg font-black text-slate-900">No Orders Placed Yet</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You haven't ordered any warehouse items yet. Experience 10-15 min dark store delivery with Cash on Delivery!
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition-all"
          >
            Start Shopping Now →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = statusStyles[order.status] || { label: order.status, class: 'bg-slate-100 text-slate-700 border-slate-200' };

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm hover:border-slate-300 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-base font-black text-slate-900">{order.orderNumber}</span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ordered on {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total (COD)</span>
                      <span className="text-lg font-black text-slate-900">₹{order.totalAmount.toFixed(0)}</span>
                    </div>
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>Live Track</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>

                {/* Items preview */}
                <div className="space-y-2">
                  {order.lines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-bold text-slate-800 truncate">{line.product.name}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          x{line.quantity} {line.product.uom}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 font-mono">
                        ₹{line.total.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span>💵</span>
                    <span className="font-medium">Cash on Delivery Handover</span>
                  </div>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Central Warehouse Dispatched
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
