'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const urlError = searchParams.get('error') || '';

  const [form, setForm] = useState({ email: 'admin@stocksense.com', password: 'admin123' });
  const [error, setError] = useState(urlError);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlError) setError(urlError);
  }, [urlError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      window.location.href = redirectUrl;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-xl shadow-indigo-500/30">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight">StockSense IMS</h1>
            <span className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Staff Portal
            </span>
          </div>
          <p className="text-slate-400 text-xs">Internal Inventory & Warehouse Management System</p>
        </div>

        {/* Demo Fast Login Chips */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-2 text-xs">
          <p className="text-slate-300 font-bold flex items-center gap-1.5">
            <span>🔑</span> Pre-created Staff Credentials:
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ email: 'admin@stocksense.com', password: 'admin123' })}
              className="flex-1 py-1.5 px-2 bg-slate-700/70 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-semibold transition-colors text-center"
            >
              Inventory Manager
            </button>
            <button
              type="button"
              onClick={() => setForm({ email: 'staff@stocksense.com', password: 'admin123' })}
              className="flex-1 py-1.5 px-2 bg-slate-700/70 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-semibold transition-colors text-center"
            >
              Warehouse Staff
            </button>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold animate-fade-in flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
                Staff Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="admin@stocksense.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/25 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to IMS'}
            </button>
          </form>

          <div className="pt-2 text-center text-xs border-t border-slate-100 space-y-2">
            <p className="text-slate-400">
              Customer looking to shop?{' '}
              <Link href="/" className="text-indigo-600 font-bold hover:underline">
                Visit Customer Storefront →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
