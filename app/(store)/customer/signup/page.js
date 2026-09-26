'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function CustomerSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/customer-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create account');
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Store Account</h1>
          <p className="text-xs text-slate-500 mt-1">Start shopping directly from our regional dark store warehouse</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="e.g. Priya Sharma"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (For Courier & Handover)</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign Up for Store'}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 space-y-2">
            <p>
              Already registered?{' '}
              <Link href="/customer/login" className="text-emerald-700 font-bold hover:underline">
                Sign In to Store
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-slate-400">Loading...</div>}>
      <CustomerSignupForm />
    </Suspense>
  );
}
