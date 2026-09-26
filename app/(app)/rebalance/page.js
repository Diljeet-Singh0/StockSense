'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RebalancePage() {
  const [moves, setMoves] = useState([]);
  const [message, setMessage] = useState('');
  const load = () => fetch('/api/rebalance').then((response) => response.json()).then((data) => setMoves(data.moves || []));
  useEffect(() => { load(); }, []);

  const createTransfer = async (move) => {
    const response = await fetch('/api/rebalance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(move) });
    const data = await response.json();
    setMessage(response.ok ? `Ready transfer ${data.transfer.reference} created.` : data.error);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Network intelligence</p>
        <h1 className="text-2xl font-black text-slate-900 mt-1">Smart Rebalance</h1>
        <p className="text-sm text-slate-500 mt-1">Move surplus stock before buying more. These are internal transfers, not new purchases.</p>
      </div>
      {message && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm font-bold text-emerald-800">{message}</div>}
      <div className="grid gap-3">
        {moves.length === 0 ? <div className="bg-white rounded-2xl p-8 border">No empty locations can be covered from surplus right now.</div> : moves.map((move) => (
          <div key={`${move.sku}-${move.toId}`} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-black text-slate-900">{move.product}</p>
              <p className="text-xs font-mono text-slate-400">{move.sku}</p>
              <p className="text-sm text-slate-600 mt-2">{move.from} → {move.to} · move {move.quantity} {move.uom}</p>
              <p className="text-xs text-slate-500 mt-1">{move.reason}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => createTransfer(move)} className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Create ready transfer</button>
              <Link href="/transfers" className="px-3 py-2 border rounded-xl text-xs font-bold">Open transfers</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
