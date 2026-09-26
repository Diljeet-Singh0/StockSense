'use client';

import { useEffect, useState } from 'react';

export default function PlanningPage() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [message, setMessage] = useState('');

  const load = () => fetch('/api/planning').then((response) => response.json()).then(setData);
  useEffect(() => { load(); }, []);

  const draft = async (action) => {
    const response = action.action === 'TRANSFER'
      ? await fetch('/api/rebalance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action) })
      : await fetch('/api/receipts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locationId: action.toId, lines: [{ productId: action.productId, quantity: action.quantity }] }) });
    const body = await response.json();
    setMessage(response.ok ? `${action.action} draft created. Stock was not moved.` : body.error);
    load();
  };

  if (!data) return <div className="h-40 bg-white rounded-2xl animate-pulse" />;
  const actions = (data.plans || []).flatMap((plan) => plan.actions.map((action) => ({ ...action, blocked: plan.blocked })));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Decision desk</p>
        <h1 className="text-2xl font-black mt-1">Buy or transfer</h1>
        <p className="text-sm text-slate-500 mt-1">Available stock, days of cover, supplier lead time, then a draft. Nothing moves until you execute it.</p>
      </div>
      {message && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm font-bold text-emerald-800">{message}</div>}
      <div className="grid sm:grid-cols-3 gap-3">
        <Card label="Transfer drafts" value={data.summary.transfers} />
        <Card label="Buy drafts" value={data.summary.buys} />
        <Card label="Unsuitable locations" value={data.summary.blocked} />
      </div>
      <div className="grid gap-3">
        {actions.length === 0 && <div className="bg-white border rounded-2xl p-8">No replenishment action right now.</div>}
        {actions.map((action, index) => (
          <article key={`${action.sku}-${action.action}-${index}`} className="bg-white border rounded-2xl p-5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-emerald-700">{action.action}</p>
                <h2 className="font-black text-lg">{action.product}</h2>
                <p className="text-sm text-slate-600 mt-1">{action.action === 'TRANSFER' ? `${action.from} → ${action.to}` : action.to} · {action.quantity} {action.uom}</p>
                <p className="text-sm mt-2">{action.reason}</p>
                {action.estimateLabel && <p className="text-xs text-amber-700 mt-2">{action.estimateLabel}: ₹{Number(action.estimatedAmount).toLocaleString('en-IN')}</p>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setOpen(open === index ? null : index)} className="px-3 py-2 border rounded-xl text-xs font-bold">Explain recommendation</button>
                <button type="button" onClick={() => draft(action)} className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Create draft</button>
              </div>
            </div>
            {open === index && (
              <ul className="mt-4 bg-slate-50 rounded-xl p-3 text-sm text-slate-600 list-disc pl-5">
                {(action.assumptions || []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return <div className="bg-white border rounded-2xl p-4"><p className="text-xs text-slate-400 font-bold">{label}</p><p className="text-3xl font-black">{value}</p></div>;
}
