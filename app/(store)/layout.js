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
      {/* Top Banner - Quick Commerce Vibe with Glass Accents */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 font-medium border-b border-white/5">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE DARK STORE
            </span>
            <span className="hidden sm:inline text-slate-300 font-medium truncate">
              Central Fulfillment Hub #1 • Dispatched in 10-15 Mins • Cash on Delivery
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-[11px]">
            <span className="text-slate-400 hidden md:inline">Need assistance? +91 80 4920 1100</span>
            <Link
              href="/admin/login"
              className="text-slate-500 hover:text-slate-300 transition-colors hidden sm:inline"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Logo & Quick Commerce Badge */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 via-indigo-700 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl text-slate-900 tracking-tight">StockSense</span>
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  QuickStore
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">⚡ 10-15 Min</span>
                <span>• Direct Dark Store Warehouse</span>
              </p>
            </div>
          </Link>

          {/* Delivery Hub Location Selector */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-xs transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              📍
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900">Indiranagar 100ft Rd</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/60 px-1.5 py-0.2 rounded">Fast Hub</span>
              </div>
              <p className="text-[11px] text-slate-400">Bengaluru, 560038 • Hub #1 Active</p>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* My Orders Button */}
            <Link
              href="/orders"
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                pathname.startsWith('/orders')
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">My Orders</span>
            </Link>

            {/* Cart Trigger Button */}
            <Link
              href="/cart"
              className="relative inline-flex items-center gap-2.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 ? (
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-emerald-400">
                  <span className="bg-white text-emerald-800 text-[11px] px-1.5 py-0.5 rounded-full font-black">
                    {cartCount}
                  </span>
                  <span className="font-extrabold text-xs">₹{cartTotal.toFixed(0)}</span>
                </div>
              ) : (
                <span className="bg-emerald-700/80 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  0
                </span>
              )}
            </Link>

            {/* Customer Account Dropdown */}
            {customer ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {customer.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden md:inline text-xs font-bold text-slate-800 truncate max-w-[100px]">
                    {customer.name}
                  </span>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{customer.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{customer.email}</p>
                    </div>
                    <Link
                      href="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <span>📦</span> My Orders & Tracking
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <span>🛒</span> Active Shopping Cart
                    </Link>
                    {(customer.role === 'MANAGER' || customer.role === 'STAFF') && (
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                      >
                        <span>🏢</span> Staff Inventory Dashboard →
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border-t border-slate-100 mt-1"
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/customer/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Log In
                </Link>
                <Link
                  href="/customer/signup"
                  className="hidden sm:inline-block px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 rounded-xl transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Discreet Admin Login Link */}
            <div className="h-5 w-px bg-slate-200 hidden sm:block mx-0.5" />
            <Link
              href="/admin/login"
              className="text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100/60 shrink-0"
              title="Staff & Inventory Management Portal"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Floating Bottom Cart Bar for Mobile */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden animate-bounce-subtle">
          <Link
            href="/cart"
            className="flex items-center justify-between p-3.5 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-700/40 font-bold text-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-white text-emerald-800 flex items-center justify-center font-black text-xs">
                {cartCount}
              </span>
              <div>
                <p className="text-xs font-bold">{cartCount} items selected</p>
                <p className="text-sm font-black">₹{cartTotal.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold bg-emerald-700 px-3 py-1.5 rounded-xl">
              <span>View Cart</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      )}
    </>
  );
}

function StoreFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800/80 mt-24">
      {/* Guarantees Bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/60 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold">
              ⚡
            </div>
            <div>
              <p className="text-white font-bold text-xs">10-15 Min Express</p>
              <p className="text-[11px] text-slate-400">Direct warehouse dark store dispatch</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg font-bold">
              💵
            </div>
            <div>
              <p className="text-white font-bold text-xs">Cash on Delivery</p>
              <p className="text-[11px] text-slate-400">Pay cash upon delivery verification</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg font-bold">
              🛡️
            </div>
            <div>
              <p className="text-white font-bold text-xs">100% Genuine Items</p>
              <p className="text-[11px] text-slate-400">Directly sourced from trusted brands</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-lg font-bold">
              📦
            </div>
            <div>
              <p className="text-white font-bold text-xs">Real-Time Inventory</p>
              <p className="text-[11px] text-slate-400">Live atomic stock levels from PostgreSQL</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                SS
              </div>
              <div>
                <span className="text-white font-black text-base tracking-tight">StockSense</span>
                <span className="text-emerald-400 font-bold text-xs block">Warehouse QuickStore</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Real-time quick-commerce direct from regional dark store hubs. Real-time ACID inventory deduction with Cash on Delivery.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Customer Services</h4>
            <ul className="space-y-2.5">
              <li><Link href="/orders" className="hover:text-white transition-colors">Live Order Tracking</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><span className="text-slate-500">Payment: Cash on Delivery (COD)</span></li>
              <li><span className="text-slate-500">Fast 15-Min Warehouse Dispatch</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">About StockSense</h4>
            <ul className="space-y-2.5">
              <li><span className="text-slate-400">Warehouse-Direct Quick Commerce</span></li>
              <li><span className="text-slate-400">Real-Time ACID Inventory</span></li>
              <li><span className="text-slate-400">10-15 Min Express Dispatch</span></li>
              <li><Link href="/customer/login" className="hover:text-white transition-colors">My Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Warehouse Guarantee</h4>
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 100% Verified Physical Stock
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Products on this storefront are physically present in dark store racks and reserved atomically the moment you order.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} StockSense v2.0 Quick Commerce. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-300">Home</Link>
            <span>•</span>
            <Link href="/customer/login" className="hover:text-slate-300">My Account</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function StoreLayout({ children }) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-slate-50/70 font-sans selection:bg-emerald-500 selection:text-white">
        <StoreNavbar />
        <main className="flex-1">{children}</main>
        <StoreFooter />
      </div>
    </CartProvider>
  );
}
