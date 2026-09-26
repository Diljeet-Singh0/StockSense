'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('returnTo') || searchParams.get('redirect') || '/';

  const [form, setForm] = useState({ email: 'customer@example.com', password: 'customer123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/customer-login', {
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-2xl mb-3 text-white shadow-lg shadow-emerald-600/25">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Sign In</h1>
          <p className="text-xs text-slate-500 mt-1">Access your saved addresses and track live warehouse orders</p>
        </div>

        {/* Demo Fast Sign-In Card */}
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 flex items-center justify-between">
          <div>
            <p className="font-extrabold flex items-center gap-1.5">
              <span>⚡</span> Demo Customer Account Ready
            </p>
            <p className="text-[11px] text-emerald-800">customer@example.com / customer123</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ email: 'customer@example.com', password: 'customer123' })}
            className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px] hover:bg-emerald-700 shadow-sm"
          >
            Auto Fill
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In to Store'}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 space-y-2">
            <p>
              New customer?{' '}
              <Link href="/customer/signup" className="text-emerald-700 font-bold hover:underline">
                Create Store Account
              </Link>
            </p>
            <div className="pt-2 border-t border-slate-100">
              <Link href="/login" className="text-slate-400 hover:text-indigo-600 font-medium text-[11px]">
                Warehouse Staff? Sign in via Admin Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-slate-500">Loading...</div>}>
      <CustomerLoginForm />
    </Suspense>
  );
}
