'use client';

import { useState } from 'react';

export default function SimulatorPage() {
  const [demandUp, setDemandUp] = useState(30);
  const [lateDays, setLateDays] = useState(2);
  const [result, setResult] = useState(null);

  const run = async () => {
    const response = await fetch(`/api/planning?demandUp=${demandUp}&lateDays=${lateDays}`);
    setResult(await response.json());
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Scenario</p>
        <h1 className="text-2xl font-black mt-1">What-if simulator</h1>
        <p className="text-sm text-slate-500 mt-1">Same planning rules, changed assumptions. This does not change live stock.</p>
      </div>
      <div className="bg-white border rounded-2xl p-4 grid sm:grid-cols-3 gap-3 items-end">
        <label className="text-sm font-bold">Demand up %<input type="number" value={demandUp} onChange={(event) => setDemandUp(event.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
        <label className="text-sm font-bold">Supplier late days<input type="number" value={lateDays} onChange={(event) => setLateDays(event.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2" /></label>
        <button type="button" onClick={run} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">Run simulation</button>
      </div>
      {result?.simulated && (
        <div className="grid md:grid-cols-2 gap-4">
          <Panel title="Current plan" data={result.current} />
          <Panel title="Simulated scenario" data={result.simulated} />
        </div>
      )}
    </div>
  );
}

function Panel({ title, data }) {
  const actions = data.plans.flatMap((plan) => plan.actions);
  return (
    <section className="bg-white border rounded-2xl p-4">
      <h2 className="font-black">{title}</h2>
      <p className="text-xs text-amber-700 mt-1">{data.label}</p>
      <p className="text-sm mt-3">{data.summary.transfers} transfers · {data.summary.buys} buys</p>
      <ul className="mt-3 space-y-2 text-sm">{actions.slice(0, 6).map((action, index) => <li key={index} className="border rounded-xl p-2">{action.action} · {action.product} · {action.quantity}</li>)}</ul>
    </section>
  );
}
