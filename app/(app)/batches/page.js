'use client';

import { useEffect, useState } from 'react';

const tone = { EXPIRED: 'text-rose-700', EXPIRING: 'text-amber-700', QUARANTINE: 'text-slate-500', AVAILABLE: 'text-emerald-700' };

export default function BatchesPage() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/batches').then((response) => response.json()).then(setData); }, []);
  if (!data) return <div className="h-40 bg-white rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Grocery control</p>
        <h1 className="text-2xl font-black mt-1">Batches and FEFO</h1>
        <p className="text-sm text-slate-500 mt-1">Pick the earliest eligible expiry first. Expired and quarantined lots are excluded.</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="font-black">Expiring soon: {data.summary.expiringPacks} packs</p>
        <p className="text-sm text-amber-800">Selling value exposed: ₹{Number(data.summary.sellingValueAtRisk).toLocaleString('en-IN')}. {data.summary.note}</p>
      </div>
      <section className="bg-white border rounded-2xl p-4">
        <h2 className="font-black mb-3">Next FEFO picks</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {data.fefo.map((item) => <div key={item.id} className="border rounded-xl p-3 text-sm"><b>{item.lotCode}</b><p>{item.product}</p><p className="text-slate-500">{item.location} · {item.quantity} · {item.daysLeft} days</p></div>)}
        </div>
      </section>
      <div className="bg-white border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-4 py-3 text-left">Lot</th><th className="px-4 py-3 text-left">Product</th><th className="px-4 py-3 text-left">Location</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Days</th><th className="px-4 py-3 text-left">Status</th></tr></thead>
          <tbody className="divide-y">{data.items.map((item) => <tr key={item.id}><td className="px-4 py-3 font-mono text-xs">{item.lotCode}</td><td className="px-4 py-3 font-bold">{item.product}</td><td className="px-4 py-3">{item.location}</td><td className="px-4 py-3 text-right">{item.quantity}</td><td className="px-4 py-3 text-right">{item.daysLeft}</td><td className={`px-4 py-3 font-black ${tone[item.status]}`}>{item.status}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
