'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function ScannerPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/products').then((response) => response.json()).then((data) => setProducts(data.products || []));
  }, []);

  const match = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return null;
    if (value.length < 3) return null;
    return products.find((product) => product.sku.toLowerCase() === value)
      || products.find((product) => product.sku.toLowerCase().includes(value) || product.name.toLowerCase().includes(value));
  }, [products, query]);

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Floor operations</p>
        <h1 className="text-2xl font-black text-slate-900 mt-1">SKU Scanner</h1>
        <p className="text-sm text-slate-500 mt-1">Type or scan a barcode/SKU and jump straight to stock action.</p>
      </div>
      <input autoFocus value={query} onChange={(event) => setQuery(event.target.value.toUpperCase())} placeholder="Scan or type SKU, e.g. DAIRY-AMUL-CS-200" className="w-full bg-white border-2 border-emerald-200 rounded-2xl px-5 py-4 text-lg font-mono shadow-sm" />
      <div className="flex flex-wrap gap-2">
        {products.slice(0, 6).map((product) => (
          <button key={product.id} onClick={() => setQuery(product.sku)} className="px-3 py-1.5 bg-white border rounded-full text-xs font-mono font-bold">{product.sku}</button>
        ))}
      </div>
      {match ? (
        <div className="bg-[#10231c] text-white rounded-3xl p-6">
          <p className="text-emerald-300 text-xs font-extrabold uppercase">{match.sku}</p>
          <h2 className="text-2xl font-black mt-1">{match.name}</h2>
          <p className="text-4xl font-black mt-4">{match.totalStock} <span className="text-base text-emerald-100">{match.uom}</span></p>
          <div className="grid sm:grid-cols-2 gap-2 mt-5">
            {(match.stockLevels || []).map((level) => (
              <div key={level.id || level.locationId} className="bg-white/10 rounded-xl p-3 flex justify-between text-sm">
                <span>{level.location?.name || 'Location'}</span><b>{Number(level.quantity)}</b>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            <Link href={`/receipts?productId=${match.id}`} className="px-3 py-2 bg-emerald-400 text-emerald-950 rounded-xl text-sm font-black">Receive</Link>
            <Link href={`/adjustments?productId=${match.id}`} className="px-3 py-2 bg-white/10 rounded-xl text-sm font-bold">Count</Link>
            <Link href={`/products/${match.id}`} className="px-3 py-2 bg-white/10 rounded-xl text-sm font-bold">Open product</Link>
          </div>
        </div>
      ) : query && <p className="text-sm text-rose-600 font-bold">No SKU match yet.</p>}
    </div>
  );
}
