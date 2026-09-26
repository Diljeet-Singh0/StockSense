'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

const categoryIcons = {
  'Dairy & Eggs': '🥛',
  'Fruits & Vegetables': '🥬',
  'Atta, Rice & Dal': '🌾',
  'Snacks & Munchies': '🍪',
  'Cold Drinks & Juices': '🥤',
  'Instant & Ready to Eat': '🍜',
  'Personal Care': '🧼',
  'Cleaning & Household': '🧹',
};

const categoryPhotos = {
  'Dairy & Eggs': '/products/milk.jpg',
  'Fruits & Vegetables': '/products/tomato.jpg',
  'Atta, Rice & Dal': '/products/rice.jpg',
  'Snacks & Munchies': '/products/chips.jpg',
  'Cold Drinks & Juices': '/products/cola.jpg',
  'Instant & Ready to Eat': '/products/noodles.jpg',
  'Personal Care': '/products/soap.jpg',
  'Cleaning & Household': '/products/dishwash.jpg',
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
    <div className="pb-16">
      <section className="relative overflow-hidden bg-[#10231c] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(52,211,153,0.22),transparent_32%),radial-gradient(circle_at_10%_80%,rgba(251,191,36,0.12),transparent_28%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16 relative">
          <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-8 items-end">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/8 border border-white/10 text-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Open now · Indiranagar dark store
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Fresh groceries,
              <span className="block text-emerald-300">at your door in minutes.</span>
            </h1>

            <p className="text-emerald-50/70 text-sm sm:text-base leading-relaxed max-w-xl">
              Milk, atta, snacks, and daily essentials picked from live warehouse stock. Pay cash when it arrives.
            </p>

            {/* Quick Search Bar inside Hero */}
            <div className="relative pt-2">
              <div className="relative flex items-center">
                <svg
                  className="absolute left-4 w-5 h-5 text-emerald-700"
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
                  placeholder="Search milk, atta, rice, snacks..."
                  className="w-full pl-12 pr-24 py-4 bg-white text-slate-900 placeholder:text-slate-400 border-0 rounded-2xl text-sm shadow-2xl shadow-black/20"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-4 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded-lg"
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
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-emerald-50 transition-all text-[11px] font-semibold"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Benefit highlights */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold text-emerald-50/90">
              {['Cash on delivery', 'Free delivery', 'No substitutions'].map((label) => (
                <div key={label} className="flex items-center gap-1.5 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">
                  <span className="text-emerald-300">✓</span> {label}
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-3">
            {[
              ['10–15', 'minute dispatch'],
              ['₹0', 'delivery fee'],
              ['COD', 'pay at the door'],
              ['Live', 'shelf stock'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-white/8 border border-white/10 p-4">
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="text-xs text-emerald-100/70 mt-1">{label}</p>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
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

            <div className="flex gap-3 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`shrink-0 min-w-[148px] p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3 ${
                  selectedCategory === ''
                    ? 'bg-[#10231c] text-white border-[#10231c] shadow-md'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:border-emerald-200'
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
                    className={`shrink-0 min-w-[168px] p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3 ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200/80 hover:border-emerald-200'
                    }`}
                  >
                    <img src={categoryPhotos[cat.name] || '/products/rice.jpg'} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
              {products.map((product) => {
                const qtyInCart = getItemQuantity(product.id);
                const isOut = !product.inStock;
                const estimatedMrp = Math.round(Number(product.price) * 1.18);

                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-950/8 transition-all duration-200 flex flex-col overflow-hidden relative"
                  >
                    {/* Delivery Time Badge */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-slate-950/75 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      <span>⚡</span>
                      <span>15 MINS</span>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 right-2 z-10">
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
                      className="relative aspect-square bg-[#f4f7f5] overflow-hidden block"
                    >
                      <img
                        src={product.imageUrl || '/products/rice.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Info & Cart Action */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
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
                      <div className="pt-2 border-t border-slate-100 flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2">
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
        <section className="bg-[#10231c] text-white rounded-3xl p-6 sm:p-10 space-y-8">
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
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-6 space-y-3">
              <span className="text-3xl inline-block">⚡</span>
              <h4 className="font-bold text-sm text-white">Ultra-Fast 15-Min Dispatch</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated pick-lists transmit instantly to warehouse staff hands the moment you press order.
              </p>
            </div>

            <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-6 space-y-3">
              <span className="text-3xl inline-block">💵</span>
              <h4 className="font-bold text-sm text-white">Cash on Delivery</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No credit cards or pre-payments required. Inspect your bag at your door and pay cash comfortably.
              </p>
            </div>

            <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-6 space-y-3">
              <span className="text-3xl inline-block">📦</span>
              <h4 className="font-bold text-sm text-white">Atomic Live Inventory</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Backed by real-time ACID transactions. If you see it on screen, it is physically in our rack.
              </p>
            </div>

            <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-6 space-y-3">
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
