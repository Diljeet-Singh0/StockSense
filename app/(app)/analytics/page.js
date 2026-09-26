'use client';

import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/analytics/abc').then((response) => response.json()).then(setData); }, []);
  if (!data) return <div className="h-40 bg-white rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Value intelligence</p>
        <h1 className="text-2xl font-black text-slate-900 mt-1">ABC Inventory Analysis</h1>
        <p className="text-sm text-slate-500 mt-1">A items drive about 80% of inventory value and deserve tighter cycle counts.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.classes.map((item) => (
          <div key={item.name} className="bg-white rounded-2xl border p-5">
            <p className="text-xs font-bold text-slate-400">CLASS {item.name}</p>
            <p className="text-3xl font-black mt-2">{item.items} SKUs</p>
            <p className="text-sm text-emerald-700 font-bold">₹{Number(item.value).toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-500 mt-2">{item.name === 'A' ? 'Count weekly' : item.name === 'B' ? 'Count monthly' : 'Count quarterly'}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 uppercase text-slate-400"><tr><th className="px-5 py-3">Class</th><th className="px-4 py-3">Product</th><th className="px-4 py-3 text-right">Value</th><th className="px-5 py-3 text-right">Share</th></tr></thead>
          <tbody className="divide-y">{data.items.map((item) => <tr key={item.id}><td className="px-5 py-3 font-black">{item.className}</td><td className="px-4 py-3"><p className="font-bold">{item.name}</p><p className="font-mono text-slate-400">{item.sku}</p></td><td className="px-4 py-3 text-right">₹{item.value.toLocaleString('en-IN')}</td><td className="px-5 py-3 text-right">{Math.round(item.share * 100)}%</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
