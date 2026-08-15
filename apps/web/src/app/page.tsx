'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Headphones, PenTool, ShieldCheck, CheckCircle, Wifi } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between overflow-y-auto">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
            I
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-xl">
            IELTS<span className="text-cyan-700 font-semibold ml-1">CDI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600">Jasurbek Rahimberdiyev (Student)</span>
          <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 font-bold text-xs flex items-center justify-center border border-cyan-300">
            JR
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12 w-full flex-1">
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
            Official Computer-Delivered IELTS Simulation
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-3 tracking-tight">
            IELTS Practice & Mock Exam Portal
          </h1>
          <p className="text-slate-600 text-base mt-1">
            Experience authentic test center conditions with server-synced timers and offline network resilience.
          </p>
        </div>

        {/* Active Mock Session Alert Box */}
        <div className="p-6 rounded-2xl bg-white border-2 border-cyan-600 shadow-md mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Active Exam Session Ready
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Academic Reading Practice Test 1 — Section 1
            </h2>
            <p className="text-sm text-slate-600">
              Session ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-xs">mock-session-001</code> • 10 Questions • 60 Minutes
            </p>
          </div>

          <Link
            href="/exam/mock-session-001"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex-shrink-0"
          >
            <span>Launch CDI Exam Runtime</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Offline Write-Ahead Buffer</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every answer is optimistically buffered to IndexedDB and flushed with exponential backoff. Zero data loss during Wi-Fi drops.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Socket.IO Control Channel</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Server-authoritative Redis countdown timer with prioritized control directives and real-time supervisor synchronization.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Authentic CDI Experience</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Draggable split-resizer, accessible drag-and-drop, in-passage text annotations, and official green answered indicator.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-slate-200 bg-white px-8 flex items-center justify-between text-xs text-slate-500">
        <span>© 2026 IELTS Mock Exam Platform. All rights reserved.</span>
        <span>Built with Next.js 15, NestJS, and Turborepo</span>
      </footer>
    </div>
  );
}
