'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  Lock,
  Mail,
  ShieldCheck,
  GraduationCap,
  Award,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const res = await login(email, password);
    if (res.success) {
      if (res.role === 'ADMIN') {
        router.push('/admin/live-monitor');
      } else {
        router.push('/');
      }
    }
  };

  const handleQuickLogin = async (presetEmail: string, presetPass: string, role: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    const res = await login(presetEmail, presetPass);
    if (res.success) {
      if (role === 'ADMIN') {
        router.push('/admin/live-monitor');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 font-sans select-none">
      <div className="max-w-md w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-600 text-white shadow-xl shadow-cyan-900/30 mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            IELTS <span className="text-cyan-400 font-semibold">Mock Platform</span>
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access authentic computer-delivered mock tests and live proctoring.
          </p>
        </div>

        {/* Quick Demo Role Switcher */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-lg">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
            Quick One-Click Demo Logins
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('student@ielts.local', 'Password123!', 'STUDENT')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Student</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Jasurbek R.</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin@ielts.local', 'Password123!', 'ADMIN')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-1.5 text-rose-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Admin</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Proctor</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('grader@ielts.local', 'Password123!', 'GRADER')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                <Award className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Grader</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Examiner</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 flex items-start gap-3 text-xs text-rose-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-600 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-sm shadow-lg shadow-cyan-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
