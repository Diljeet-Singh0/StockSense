'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

export default function StoreProductPage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, items } = useCart();

  useEffect(() => {
    fetch(`/api/store/products/${id}`)
      .then((r) => r.json())
      .then((d) => setProduct(d.product))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-400 mt-2 font-medium">Checking live dark store rack...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-5xl">📦</div>
        <h2 className="text-lg font-bold text-slate-900">Product Not Available</h2>
        <p className="text-xs text-slate-500">This item may be hidden or removed from the dark store catalog.</p>
        <Link href="/" className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20">
          ← Back to Shop
        </Link>
      </div>
    );
  }

  const inCart = items.find((i) => i.id === product.id);
  const estimatedMrp = Math.round(Number(product.price) * 1.18);
  const discountPercent = Math.round(((estimatedMrp - Number(product.price)) / estimatedMrp) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-emerald-600 font-bold">Store Home</Link>
        <span>/</span>
        <span className="text-slate-400">{product.category?.name || 'Catalog'}</span>
        <span>/</span>
        <span className="text-slate-900 font-bold truncate max-w-xs">{product.name}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 shadow-sm">
        {/* Image Container */}
        <div className="relative aspect-square bg-slate-50/70 rounded-3xl overflow-hidden border border-slate-100 flex items-center justify-center p-8">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-300" />
          ) : (
            <span className="text-7xl text-slate-300">📦</span>
          )}

          {/* Express Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
            <span>⚡</span>
            <span>15 MIN DISPATCH</span>
          </div>

          {discountPercent > 0 && (
            <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
              {discountPercent}% OFF
            </div>
          )}
        </div>

        {/* Info & Cart Action */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider">
                {product.category?.name || 'Pantry Essential'}
              </span>
              {product.inStock ? (
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>In Stock ({product.totalStock} available in Hub #1)</span>
                </span>
              ) : (
                <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-xl">
                  Out of Stock
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                <span>★</span>
                <span className="text-slate-900">4.9</span>
                <span className="text-slate-400 font-normal">(180+ deliveries)</span>
              </div>
              <span className="text-xs font-mono text-slate-400">SKU: {product.sku}</span>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Direct Dark Store Wholesale Price</span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900">₹{Number(product.price).toFixed(0)}</span>
                {estimatedMrp > Number(product.price) && (
                  <span className="text-sm text-slate-400 line-through">MRP: ₹{estimatedMrp}</span>
                )}
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                  Save ₹{(estimatedMrp - Number(product.price)).toFixed(0)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Inclusive of all local taxes • Sold per 1 {product.uom}</p>
            </div>

            {product.description && (
              <div className="space-y-1.5 pt-1">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Product Highlights</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Quick-Commerce Perks */}
          <div className="bg-gradient-to-r from-emerald-50/60 to-teal-50/60 rounded-2xl p-4 border border-emerald-100 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold">
              <span className="text-emerald-600">⚡</span>
              <span>10-15 Min Express Dispatch from Indiranagar Central Hub</span>
            </div>
            <div className="flex items-center gap-2 font-bold">
              <span className="text-indigo-600">💵</span>
              <span>Cash on Delivery Only — Inspect at door before payment</span>
            </div>
            <div className="flex items-center gap-2 font-bold">
              <span className="text-amber-600">🛡️</span>
              <span>100% Genuine Physical Stock Guarantee</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            {product.inStock ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-l-2xl transition-colors active:scale-90"
                  >
                    −
                  </button>
                  <span className="px-3.5 py-2.5 text-sm font-black text-slate-900 min-w-[24px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.totalStock, quantity + 1))}
                    className="px-3.5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-r-2xl transition-colors active:scale-90"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => addToCart(product, quantity)}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {inCart ? `Add More (${inCart.quantity} in bag)` : `Add to Bag • ₹${(Number(product.price) * quantity).toFixed(0)}`}
                </button>

                {inCart && (
                  <Link
                    href="/cart"
                    className="px-5 py-3.5 bg-slate-950 text-white rounded-2xl text-xs sm:text-sm font-black hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    View Bag →
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs font-bold text-center border border-rose-200">
                Currently Out of Stock in Central Fulfillment Hub
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
