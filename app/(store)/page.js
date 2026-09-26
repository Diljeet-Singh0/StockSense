'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

const categoryIcons = {
  'Dairy & Breakfast': '🥛',
  'Atta, Rice & Dal': '🌾',
  'Snacks & Munchies': '🍪',
  'Beverages': '☕',
  'Instant & Frozen Food': '🍜',
  'Personal Care': '🧼',
  'Home & Cleaning': '🧹',
};

const quickKeywords = ['Milk', 'Ghee', 'Atta', 'Rice', 'Biscuits', 'Coffee', 'Chips'];

export default function StoreHomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const { items, addToCart, updateQuantity } = useCart();

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (search) params.set('search', search);

    fetch(`/api/store/products?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        if (d.categories) setCategories(d.categories);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCategory, search]);

  const getItemQuantity = (productId) => {
    const item = items.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* Ultra-Modern Quick-Commerce Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Direct Dark Store Warehouse Fulfillment</span>
              <span>•</span>
              <span>10-15 Min Delivery</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none">
              Daily Essentials & Groceries,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-yellow-300">
                Delivered in Minutes.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              Direct dispatch from regional fulfillment dark stores to your door. Real-time live inventory with Cash on Delivery payment.
            </p>

            {/* Quick Search Bar inside Hero */}
            <div className="relative pt-2">
              <div className="relative flex items-center">
                <svg
                  className="absolute left-4 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search 1,000+ items: fresh milk, atta, rice, ghee, snacks..."
                  className="w-full pl-12 pr-28 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/15 transition-all shadow-xl shadow-black/20"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-4 text-xs font-bold text-slate-400 hover:text-white bg-white/10 px-2 py-1 rounded-lg"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Popular quick tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                <span className="text-slate-400 font-medium">Trending searches:</span>
                {quickKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => setSearch(kw)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-all text-[11px] font-semibold"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Benefit highlights */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-200">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <span className="text-emerald-400">✓</span> 100% Cash on Delivery
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <span className="text-emerald-400">✓</span> ₹0 Packaging & Delivery Fee
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <span className="text-emerald-400">✓</span> Zero Substitution Guarantee
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Category Visual Cards */}
        {categories.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Shop by Category</span>
                <span className="text-xs font-semibold text-slate-400">({categories.length} departments)</span>
              </h2>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory('')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  Clear filter ✕
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <button
                onClick={() => setSelectedCategory('')}
                className={`p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3 ${
                  selectedCategory === ''
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-xs font-black leading-tight">All Items</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{products.length} Products</p>
                </div>
              </button>

              {categories.map((cat) => {
                const icon = categoryIcons[cat.name] || '📦';
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? '' : cat.id)}
                    className={`p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-white text-slate-700 border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate leading-tight">{cat.name}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">Dispatched fast</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Product Catalog Grid */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name || 'Products'
                  : search
                  ? `Search results for "${search}"`
                  : 'Popular Dark Store Essentials'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Showing {products.length} live warehouse items ready for instantaneous picking
              </p>
            </div>

            {/* Quick Sort / Info */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Indiranagar Dark Store Hub Online</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 animate-pulse space-y-3">
                  <div className="w-full aspect-square bg-slate-200 rounded-2xl" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center max-w-md mx-auto space-y-3 shadow-sm">
              <div className="text-5xl mb-2">🔍</div>
              <h3 className="text-lg font-bold text-slate-900">No items matched your search</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We couldn't find items matching &quot;{search}&quot;. Try exploring other categories or reset your filters.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                }}
                className="mt-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {products.map((product) => {
                const qtyInCart = getItemQuantity(product.id);
                const isOut = !product.inStock;
                const estimatedMrp = Math.round(Number(product.price) * 1.18);

                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-600/10 transition-all duration-300 flex flex-col overflow-hidden relative"
                  >
                    {/* Delivery Time Badge */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                      <span>⚡</span>
                      <span>15 MINS</span>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      {isOut ? (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          Sold Out
                        </span>
                      ) : product.totalStock <= 5 ? (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          Only {product.totalStock} left
                        </span>
                      ) : null}
                    </div>

                    {/* Image Area */}
                    <Link
                      href={`/product/${product.id}`}
                      className="relative aspect-square bg-slate-50/80 overflow-hidden block p-3 group-hover:bg-slate-100/50 transition-colors"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">
                          📦
                        </div>
                      )}
                    </Link>

                    {/* Info & Cart Action */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {product.category?.name || 'Daily Need'}
                        </p>
                        <Link href={`/product/${product.id}`}>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 mt-0.5 hover:text-emerald-600 transition-colors leading-snug">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                          Net: 1 {product.uom}
                        </p>
                      </div>

                      {/* Pricing & Add Stepper */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm sm:text-base font-black text-slate-900">
                              ₹{Number(product.price).toFixed(0)}
                            </span>
                            {estimatedMrp > Number(product.price) && (
                              <span className="text-[11px] text-slate-400 line-through">
                                ₹{estimatedMrp}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold block">
                            Wholesale direct
                          </span>
                        </div>

                        {/* Interactive Cart Button */}
                        {isOut ? (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed"
                          >
                            Out
                          </button>
                        ) : qtyInCart > 0 ? (
                          <div className="inline-flex items-center bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/30 text-xs font-bold">
                            <button
                              onClick={() => updateQuantity(product.id, qtyInCart - 1)}
                              className="px-2.5 py-1.5 hover:bg-emerald-700 transition-colors rounded-l-xl active:scale-90"
                              title="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="px-2 py-1.5 font-black text-xs min-w-[20px] text-center">
                              {qtyInCart}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, qtyInCart + 1)}
                              disabled={qtyInCart >= product.totalStock}
                              className="px-2.5 py-1.5 hover:bg-emerald-700 transition-colors rounded-r-xl disabled:opacity-40 active:scale-90"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product, 1)}
                            className="px-3 sm:px-4 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 hover:border-emerald-600 rounded-xl text-xs font-extrabold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                          >
                            <span>+</span>
                            <span>ADD</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Why StockSense Dark Store Warehouse Direct Section */}
        <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-emerald-400 text-xs font-extrabold uppercase tracking-widest">
              StockSense Advantage
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Why Shop Direct From Our Fulfillment Warehouse?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Cut out retail margins. Enjoy freshly received inventory straight from our temperature-controlled regional hub.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
              <span className="text-3xl inline-block">⚡</span>
              <h4 className="font-bold text-sm text-white">Ultra-Fast 15-Min Dispatch</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated pick-lists transmit instantly to warehouse staff hands the moment you press order.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
              <span className="text-3xl inline-block">💵</span>
              <h4 className="font-bold text-sm text-white">Cash on Delivery</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No credit cards or pre-payments required. Inspect your bag at your door and pay cash comfortably.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
              <span className="text-3xl inline-block">📦</span>
              <h4 className="font-bold text-sm text-white">Atomic Live Inventory</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Backed by real-time ACID transactions. If you see it on screen, it is physically in our rack.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
              <span className="text-3xl inline-block">🛡️</span>
              <h4 className="font-bold text-sm text-white">Zero Question Replacement</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Damaged or unexpected condition? Instant replacement handled right at your doorstep.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
