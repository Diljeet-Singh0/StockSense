'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../layout';

export default function ProfilePage() {
  const contextUser = useUser();
  const [user, setUser] = useState(contextUser);
  const [loading, setLoading] = useState(!contextUser);

  useEffect(() => {
    if (contextUser) {
      setUser(contextUser);
      setLoading(false);
      return;
    }

    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .finally(() => setLoading(false));
  }, [contextUser]);

  if (loading) {
    return <div className="h-40 rounded-2xl bg-white border border-slate-100 animate-pulse" />;
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Account & access</p>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Your identity, role, and audit responsibility inside StockSense.</p>
      </div>

      <section className="bg-[#10231c] rounded-3xl p-6 sm:p-8 text-white overflow-hidden relative">
        <div className="absolute -right-12 -top-16 w-48 h-48 rounded-full border-[24px] border-emerald-300/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-600 flex items-center justify-center text-3xl font-black shadow-xl shadow-emerald-950/30">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-2xl font-black">{user?.name || 'StockSense operator'}</h2>
            <p className="text-emerald-100/70 text-sm mt-1">{user?.email || 'No email available'}</p>
            <span className="inline-flex mt-3 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-emerald-200 text-[11px] font-extrabold uppercase tracking-wider">
              {user?.role || 'STAFF'} access
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Operator ID</p>
          <p className="font-mono text-sm text-slate-800 mt-2 break-all">{user?.id || 'Unavailable'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Joined StockSense</p>
          <p className="text-sm text-slate-800 mt-2">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) : 'Unavailable'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">Access responsibilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {['Create and validate stock documents', 'Maintain physical counts', 'Leave an auditable ledger trail'].map((item) => (
            <div key={item} className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700 font-semibold">{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
