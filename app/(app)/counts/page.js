'use client';

import { useEffect, useState } from 'react';

export default function CountsPage() {
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');
  const [counts, setCounts] = useState({});

  const load = () => fetch('/api/counts').then((response) => response.json()).then((data) => setTasks(data.tasks || []));
  useEffect(() => { load(); }, []);

  const generate = async () => {
    const response = await fetch('/api/counts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate' }) });
    const data = await response.json();
    setMessage(response.ok ? `${data.created} blind count tasks created from high stock-value items.` : data.error);
    load();
  };

  const act = async (id, action, extra = {}) => {
    const response = await fetch(`/api/counts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) });
    const data = await response.json();
    setMessage(response.ok ? `Count ${action} saved.` : data.error);
    load();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Control</p>
          <h1 className="text-2xl font-black mt-1">Cycle counts</h1>
          <p className="text-sm text-slate-500 mt-1">Blind count, manager approval, then one ledger posting. If stock moved after the snapshot, posting is blocked.</p>
        </div>
        <button type="button" onClick={generate} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Generate A-class counts</button>
      </div>
      {message && <div className="bg-slate-50 border rounded-xl p-3 text-sm font-bold">{message}</div>}
      <div className="grid gap-3">
        {tasks.map((task) => (
          <article key={task.id} className="bg-white border rounded-2xl p-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-black">{task.product}</p>
                <p className="text-xs font-mono text-slate-400">{task.sku} · {task.location} · {task.reference}</p>
              </div>
              <b className="text-xs">{task.status}</b>
            </div>
            {!task.blind || task.status !== 'OPEN' ? <p className="text-sm mt-2">Snapshot: {task.systemQty}</p> : <p className="text-sm mt-2 text-slate-500">Blind count. Expected quantity is hidden.</p>}
            {task.status === 'OPEN' && (
              <div className="flex gap-2 mt-3">
                <input value={counts[task.id] || ''} onChange={(event) => setCounts({ ...counts, [task.id]: event.target.value })} placeholder="Physical count" className="border rounded-xl px-3 py-2 text-sm w-36" />
                <button type="button" onClick={() => act(task.id, 'submit', { countedQty: Number(counts[task.id]), reason: 'Cycle count' })} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Submit</button>
              </div>
            )}
            {task.status === 'SUBMITTED' && (
              <div className="mt-3 text-sm">
                <p>Counted {task.countedQty}. Difference {task.countedQty - task.systemQty}. Waiting for manager.</p>
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => act(task.id, 'post')} className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Approve and post</button>
                  <button type="button" onClick={() => act(task.id, 'reject')} className="px-3 py-2 border rounded-xl text-xs font-bold">Reject</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
