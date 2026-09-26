'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, cartTotal, clearCart, isAuthenticated, authChecked, requireAuth } = useCart();

  // Gate: must be logged in to checkout
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      requireAuth();
    }
  }, [authChecked, isAuthenticated, requireAuth]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [useCustomAddress, setUseCustomAddress] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.user) {
          setForm((prev) => ({
            ...prev,
            name: data.user.name || '',
            phone: data.user.phone || '',
          }));
        }
      });

    fetch('/api/customer/addresses')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.addresses && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          const defaultAddr = data.addresses.find((a) => a.isDefault) || data.addresses[0];
          setForm((prev) => ({
            ...prev,
            line1: defaultAddr.line1,
            line2: defaultAddr.line2 || '',
            city: defaultAddr.city,
            state: defaultAddr.state,
            pincode: defaultAddr.pincode,
          }));
        } else {
          setUseCustomAddress(true);
        }
      });
  }, []);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Your cart is empty. Add products before checking out.');
      return;
    }

    if (!form.name || !form.phone || !form.line1 || !form.city || !form.pincode) {
      setError('Please fill in all required delivery address fields.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
        })),
        shippingAddress: {
          name: form.name,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        phone: form.phone,
        notes: form.notes,
      };

      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to place order.');
        setLoading(false);
        return;
      }

      clearCart();
      router.push(`/orders/${data.order.id}?new=true`);
    } catch {
      setError('An unexpected network error occurred.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="text-5xl">🛒</div>
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Add warehouse items before proceeding to checkout.</p>
        <Link href="/" className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20">
          Explore Products →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in pb-16">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            ⚡ Express Dark Store Dispatch
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Delivery & Checkout</h1>
        <p className="text-xs text-slate-500">Direct courier dispatch from Indiranagar Hub #1 • Cash on Delivery Only</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Delivery Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Address Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-7 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">1</span>
                <span>Delivery Address</span>
              </h2>
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseCustomAddress(!useCustomAddress)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  {useCustomAddress ? 'Use Saved Address' : '+ New Address'}
                </button>
              )}
            </div>

            {savedAddresses.length > 0 && !useCustomAddress && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedAddresses.map((addr) => {
                  const isSelected = form.line1 === addr.line1 && form.pincode === addr.pincode;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          line1: addr.line1,
                          line2: addr.line2 || '',
                          city: addr.city,
                          state: addr.state,
                          pincode: addr.pincode,
                        }));
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{addr.city}</span>
                        {isSelected && <span className="text-emerald-700 text-xs font-bold">✓ Selected</span>}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{addr.line1}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">{addr.pincode}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (For Delivery Handover) *</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Address Line 1 (Flat, Society, Street) *</label>
              <input
                required
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                placeholder="e.g. Flat 402, Royal Palms, 12th Cross, Indiranagar"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                <input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Postal PIN Code *</label>
                <input
                  required
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Landmark / Delivery Instructions (Optional)</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Near Metro Station pillar 14, ring bell twice..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* 2. Delivery Speed Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">2</span>
              <span>Delivery Time Window</span>
            </h2>

            <div className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Immediate Express Dispatch</p>
                  <p className="text-[11px] text-emerald-800">Estimated delivery in 10-15 mins from Indiranagar Hub</p>
                </div>
              </div>
              <span className="text-emerald-700 font-extrabold text-xs">FREE</span>
            </div>
          </div>

          {/* 3. Payment Method Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs">3</span>
              <span>Payment Option</span>
            </h2>

            <div className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl font-bold">
                  💵
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</p>
                    <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.2 rounded-full uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Pay cash upon inspecting goods at your doorstep. Zero advance payment.</p>
                </div>
              </div>
              <span className="text-emerald-600 font-black text-sm">✓ Selected</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-5 sticky top-28">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Order Items ({items.length})</h3>

            {/* Mini Items Preview */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 shrink-0 overflow-hidden">
                      <img src={item.imageUrl || '/products/rice.jpg'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate text-slate-800 font-medium">{item.name}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(0)}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">x{item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs pt-2">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Dark Store Packaging</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Express Doorstep Delivery</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-sm">
                <span className="font-extrabold text-slate-900">Total Due on Delivery</span>
                <span className="text-2xl font-black text-slate-900">₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black text-center block shadow-lg shadow-emerald-600/25 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? 'Transmitting to Warehouse...' : `Confirm Order (₹${cartTotal.toFixed(0)} COD) →`}
            </button>

            <div className="space-y-1 text-center">
              <p className="text-[11px] text-slate-400 leading-tight">
                Stock is reserved atomically from Indiranagar Hub upon clicking confirm.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
