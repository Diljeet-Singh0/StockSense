'use client';

import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const steps = [
  { key: 'PLACED', title: 'Order Placed', desc: 'Received & stock reserved' },
  { key: 'CONFIRMED', title: 'Confirmed & Packed', desc: 'Warehouse picking completed' },
  { key: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Courier dispatched from hub' },
  { key: 'DELIVERED', title: 'Delivered', desc: 'Received & paid cash' },
];

function OrderTrackingContent({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');

  const fetchOrder = () => {
    fetch(`/api/customer/orders/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Order not found');
        return r.json();
      })
      .then((d) => setOrder(d.order))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order? Reserved warehouse stock will be restored immediately.')) {
      return;
    }

    setCanceling(true);
    setError('');

    try {
      const res = await fetch(`/api/customer/orders/${id}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to cancel order');
        return;
      }

      setCancelSuccess('Order canceled and warehouse stock restored.');
      fetchOrder();
    } catch {
      setError('An error occurred while canceling');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-base font-bold text-slate-900">Order Error</h2>
        <p className="text-xs text-slate-500">{error}</p>
        <Link href="/orders" className="text-xs font-bold text-indigo-600 hover:underline">
          ← Back to My Orders
        </Link>
      </div>
    );
  }

  const getStepIndex = (status) => {
    switch (status) {
      case 'PLACED': return 0;
      case 'CONFIRMED': return 1;
      case 'OUT_FOR_DELIVERY': return 2;
      case 'DELIVERED': return 3;
      case 'CANCELED': return -1;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(order.status);
  const isCanceled = order.status === 'CANCELED';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* New Order Celebration Banner */}
      {isNew && (
        <div className="bg-emerald-500 text-white p-5 rounded-3xl shadow-lg shadow-emerald-500/20 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <span>🎉</span> Order Placed Successfully!
            </h3>
            <p className="text-xs text-emerald-100">
              Your order has been transmitted directly to our Central Warehouse for picking & packing.
            </p>
          </div>
          <span className="text-3xl">📦</span>
        </div>
      )}

      {cancelSuccess && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl text-xs font-semibold">
          {cancelSuccess}
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                {order.orderNumber}
              </h1>
              {isCanceled ? (
                <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Canceled
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>⚡</span> Live Tracking
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ordered on {new Date(order.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Total Due (Cash on Delivery)</span>
            <p className="text-2xl font-black text-slate-900">₹{order.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Status Timeline Tracker */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Delivery Progress
          </h2>

          {isCanceled ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2 font-medium">
              <span>🚫</span>
              <span>This order was canceled. All quantities have been returned to warehouse stock.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
              {steps.map((step, idx) => {
                const isPassed = currentStep >= idx;
                const isCurrent = currentStep === idx;

                return (
                  <div key={step.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                          isPassed
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isPassed ? '✓' : idx + 1}
                      </div>
                      <div
                        className={`h-1 flex-1 rounded-full ${
                          isPassed && idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isCurrent ? 'text-emerald-700' : isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.title}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Order Items Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900">Ordered Warehouse Items</h3>

        <div className="divide-y divide-slate-100">
          {order.lines.map((line) => (
            <div key={line.id} className="py-3 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-900">{line.product.name}</p>
                <p className="text-slate-400 font-mono">
                  {line.quantity} {line.product.uom} × ₹{line.unitPrice.toFixed(2)}
                </p>
              </div>
              <span className="font-black text-slate-900 text-sm font-mono">
                ₹{line.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
          <span className="text-slate-500">Payment: Cash on Delivery (COD)</span>
          <span className="font-bold text-slate-900">Total: ₹{order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Shipping Address & Dispatch Hub Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-2 text-xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
            <span>📍</span> Delivery Destination
          </h3>
          <p className="font-bold text-slate-800">{order.shippingAddress?.name || 'Customer'}</p>
          <p className="text-slate-600 leading-relaxed">{order.shippingAddress?.line1}</p>
          {order.shippingAddress?.line2 && <p className="text-slate-500">{order.shippingAddress.line2}</p>}
          <p className="text-slate-600 font-mono">
            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
          </p>
          {order.customerPhone && (
            <p className="text-slate-500 font-mono pt-1">Phone: {order.customerPhone}</p>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3 text-xs">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <span>⚡</span> Fulfillment Dark Store
          </h3>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Indiranagar Fulfillment Hub #1
            </p>
            <p className="text-[11px] text-slate-500">Pick-list and packing auto-synced with warehouse staff.</p>
          </div>
          <div className="flex items-center justify-between text-slate-600 pt-1">
            <span>Payment Mode</span>
            <span className="font-bold text-slate-900">Cash on Delivery (COD)</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span className="font-bold text-emerald-600">FREE</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          <span>←</span> Back to All Orders
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            🖨️ Print Receipt
          </button>

          {!isCanceled && (order.status === 'PLACED' || order.status === 'CONFIRMED') && (
            <button
              onClick={handleCancelOrder}
              disabled={canceling}
              className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {canceling ? 'Canceling & Restoring Stock...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackingPage(props) {
  return (
    <Suspense fallback={<div className="p-16 text-center text-slate-500">Loading order timeline...</div>}>
      <OrderTrackingContent {...props} />
    </Suspense>
  );
}
