'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();

  const totalSavings = items.reduce((sum, item) => {
    const estMrp = Math.round(Number(item.price) * 1.18);
    return sum + (estMrp - Number(item.price)) * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5 animate-fade-in">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-50 to-indigo-50 border border-slate-200/80 rounded-3xl flex items-center justify-center text-5xl mx-auto shadow-sm">
          🛒
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          Explore our fresh dairy, atta, snacks, and daily essentials straight from the warehouse dark store.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
        >
          Explore Warehouse Catalog →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in pb-16">
      {/* Title & Clear Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Shopping Bag</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {items.length} {items.length === 1 ? 'item' : 'items'} reserved in live dark store inventory
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors"
        >
          Clear Cart
        </button>
      </div>

      {/* Express Delivery Banner */}
      <div className="bg-[#10231c] text-white p-4 sm:p-5 rounded-3xl shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
            ⚡
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">Express Dispatch in 10-15 Minutes</h3>
            <p className="text-xs text-emerald-100">Fulfilling from Indiranagar Hub #1 • Free Doorstep Delivery</p>
          </div>
        </div>
        <span className="hidden sm:inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider">
          LIVE QUEUE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center p-2">
                  <img src={item.imageUrl || '/products/rice.jpg'} alt={item.name} className="w-full h-full object-cover" />
                </div>

                <div className="min-w-0">
                  <Link href={`/product/${item.id}`} className="text-sm font-bold text-slate-900 hover:text-emerald-600 line-clamp-1 transition-colors">
                    {item.name}
                  </Link>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    ₹{item.price.toFixed(0)} per {item.uom}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
                    <span>✓</span> Verified in stock
                  </span>
                </div>
              </div>

              {/* Stepper & Total */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold shadow-sm">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-700 rounded-l-xl transition-colors active:scale-90"
                  >
                    −
                  </button>
                  <span className="px-2.5 py-1.5 font-black text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-700 rounded-r-xl transition-colors disabled:opacity-30 active:scale-90"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <p className="text-sm sm:text-base font-black text-slate-900">
                    ₹{(item.price * item.quantity).toFixed(0)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-[11px] text-slate-400 hover:text-rose-600 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Link
              href="/"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Add more warehouse essentials</span>
            </Link>
          </div>
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-5">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Bill Summary</h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{cartTotal.toFixed(2)}</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Warehouse Discount Savings</span>
                  <span>−₹{totalSavings.toFixed(0)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Dark Store Packaging & Handling</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Express Doorstep Dispatch</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-sm">
                <span className="font-extrabold text-slate-900">Total Payable</span>
                <span className="text-2xl font-black text-slate-900">₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Cash on Delivery Banner */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-950 font-bold">
              <span className="text-base">💵</span>
              <div>
                <p>Payment Mode: Cash on Delivery (COD)</p>
                <p className="text-[11px] text-amber-800 font-normal">Pay cash directly to courier after checking goods.</p>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black text-center block shadow-lg shadow-emerald-600/25 active:scale-98 transition-all"
            >
              Proceed to Delivery Address →
            </Link>

            <div className="pt-2 text-center space-y-1">
              <p className="text-[11px] text-slate-400 font-medium">
                ⚡ Stock is reserved atomically in PostgreSQL on checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
