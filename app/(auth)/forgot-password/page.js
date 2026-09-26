'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }

      setMessage(data.message);
      setStep('otp');
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Reset failed');
        return;
      }

      router.push('/login');
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-cyan-50/20 px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl mb-4 shadow-lg shadow-indigo-500/25">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 'email' ? 'Reset your password' : 'Enter OTP'}
          </h1>
          <p className="text-slate-500 mt-1">
            {step === 'email' ? "We'll send a code to your email" : 'Check your email for the 6-digit code'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          {step === 'email' ? (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                  placeholder="you@company.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>
              )}
              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">{message}</div>
              )}

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1.5">OTP Code</label>
                <input
                  id="otp"
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  placeholder="000000"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                  placeholder="Min. 6 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
