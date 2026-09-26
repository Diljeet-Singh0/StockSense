'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SuggestionsPage() {
  const [data, setData] = useState({ suggestions: [], summary: {} });
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ locationId: '', categoryId: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
    setLoading(true);
    fetch(`/api/purchase-suggestions${query ? `?${query}` : ''}`)
      .then((response) => response.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetch('/api/locations').then((response) => response.json()).then((payload) => setLocations(payload.locations || []));
    fetch('/api/categories').then((response) => response.json()).then((payload) => setCategories(payload.categories || []));
  }, []);

  const summary = data.summary || {};
  const suggestions = data.suggestions || [];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Reorder intelligence</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Purchase Suggestions</h1>
          <p className="text-sm text-slate-500 mt-1">Buy only what is below the safety threshold, with quantity and estimated cost.</p>
        </div>
        <Link href="/receipts" className="px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-bold">Create receipt</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ['Items to reorder', summary.items || 0],
          ['Suggested units', summary.units || 0],
          ['Estimated buy value', `₹${Number(summary.estimatedCost || 0).toLocaleString('en-IN')}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select value={filters.locationId} onChange={(event) => setFilters((current) => ({ ...current, locationId: event.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
          <option value="">All warehouses</option>
          {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </select>
        <select value={filters.categoryId} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {loading ? <div className="p-12 text-center text-sm text-slate-500">Calculating reorder plan...</div> : suggestions.length === 0 ? (
          <div className="p-12 text-center"><p className="font-bold text-slate-800">No purchase needed</p><p className="text-xs text-slate-400 mt-1">Every filtered item is above its reorder point.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider">
                <tr><th className="px-5 py-3">Product</th><th className="px-4 py-3 text-right">On hand</th><th className="px-4 py-3 text-right">Reorder at</th><th className="px-4 py-3 text-right">Buy</th><th className="px-5 py-3 text-right">Est. cost</th><th className="px-5 py-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suggestions.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3"><p className="font-bold text-slate-900">{item.name}</p><p className="font-mono text-slate-400">{item.sku}</p></td>
                    <td className={`px-4 py-3 text-right font-black ${item.onHand <= 0 ? 'text-rose-600' : 'text-amber-600'}`}>{item.onHand} {item.uom}</td>
                    <td className="px-4 py-3 text-right">{item.reorderPoint}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-700">+{item.suggestedQty}</td>
                    <td className="px-5 py-3 text-right font-bold">₹{item.estimatedCost.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3 text-right"><Link href={`/receipts?productId=${item.id}`} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">Receive</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
