'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { CartProvider, useCart } from '@/lib/cart-context';

function StoreNavbar() {
  const pathname = usePathname();
  const { cartCount, cartTotal, customer, setCustomer } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCustomer(null);
    window.location.href = '/';
  };

  return (
    <>
      <div className="bg-[#10231c] text-emerald-50/80 text-xs py-2.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 truncate">
            <span className="inline-flex items-center gap-1.5 bg-emerald-400/15 border border-emerald-300/25 text-emerald-200 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Live now
            </span>
            <span className="hidden sm:inline truncate">
              Indiranagar hub · 10–15 min dispatch · Cash on delivery · Free delivery
            </span>
          </div>
          <span className="text-emerald-100/60 hidden md:inline shrink-0">Help · +91 80 4920 1100</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-emerald-950/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-[4.5rem] flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-700/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-extrabold text-lg sm:text-[1.35rem] text-slate-950 tracking-tight truncate">StockSense</span>
                <span className="hidden sm:inline bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Fresh
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 font-semibold">Groceries in 10–15 minutes</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-3 px-3.5 py-2 bg-emerald-50/80 border border-emerald-100 rounded-2xl text-xs">
            <div className="w-8 h-8 rounded-xl bg-white text-emerald-700 flex items-center justify-center text-sm shadow-sm">
              📍
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900">Indiranagar 100ft Rd</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full">Fast Hub</span>
              </div>
              <p className="text-[11px] text-slate-500">Bengaluru, 560038 · Hub active</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/orders"
              className={`inline-flex items-center gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                pathname.startsWith('/orders')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">My Orders</span>
            </Link>

            <Link
              href="/cart"
              className="relative inline-flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-800/20 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              <span className="bg-white text-emerald-800 text-[11px] px-1.5 py-0.5 rounded-full font-black">
                {cartCount}
              </span>
              {cartCount > 0 && (
                <span className="hidden sm:inline font-extrabold text-xs border-l border-emerald-500 pl-2">
                  ₹{cartTotal.toFixed(0)}
                </span>
              )}
            </Link>

            {customer ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xs">
                    {customer.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden md:inline text-xs font-bold text-slate-800 truncate max-w-[100px]">
                    {customer.name}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{customer.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{customer.email}</p>
                    </div>
                    <Link href="/orders" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      My orders
                    </Link>
                    <Link href="/cart" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      Cart
                    </Link>
                    {(customer.role === 'MANAGER' || customer.role === 'STAFF') && (
                      <Link href="/dashboard" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
                        Warehouse desk
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border-t border-slate-100 mt-1"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/customer/login" className="px-2.5 sm:px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl">
                  Log In
                </Link>
                <Link href="/customer/signup" className="hidden min-[420px]:inline-block px-3.5 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-xl">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {cartCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden">
          <Link href="/cart" className="flex items-center justify-between p-3.5 bg-emerald-800 text-white rounded-2xl shadow-xl font-bold text-sm">
            <span>{cartCount} items · ₹{cartTotal.toFixed(0)}</span>
            <span>View cart →</span>
          </Link>
        </div>
      )}
    </>
  );
}

function StoreFooter() {
  return (
    <footer className="bg-[#0d1c17] text-slate-400 text-xs mt-20">
      <div className="border-b border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            ['⚡', '10–15 min', 'Picked from the live hub'],
            ['💵', 'Cash on delivery', 'Pay when the bag arrives'],
            ['🛡️', 'Genuine stock', 'Only what is on the shelf'],
            ['📦', 'Live inventory', 'Sold out means sold out'],
          ].map(([icon, title, copy]) => (
            <div key={title} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                {icon}
              </div>
              <div>
                <p className="text-white font-bold text-xs">{title}</p>
                <p className="text-[11px] text-slate-400">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <p className="text-white font-extrabold text-sm">StockSense</p>
          <p className="mt-1 max-w-sm leading-relaxed">Groceries dispatched from the Indiranagar dark store.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/orders" className="hover:text-white">Orders</Link>
          <Link href="/customer/login" className="hover:text-white">Account</Link>
        </div>
      </div>
    </footer>
  );
}

export default function StoreLayout({ children }) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col store-bg font-sans">
        <StoreNavbar />
        <main className="flex-1">{children}</main>
        <StoreFooter />
      </div>
    </CartProvider>
  );
}
