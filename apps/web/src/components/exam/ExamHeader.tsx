'use client';

import React from 'react';
import { useExamStore } from '@/stores/examStore';
import { Clock, Wifi, WifiOff, RefreshCw, ShieldCheck } from 'lucide-react';

export const ExamHeader: React.FC = () => {
  const timeRemaining = useExamStore((s) => s.timeRemaining);
  const syncStatus = useExamStore((s) => s.syncStatus);
  const fontSize = useExamStore((s) => s.fontSize);
  const setFontSize = useExamStore((s) => s.setFontSize);
  const testTitle = useExamStore((s) => s.testTitle);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemaining < 300;

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between select-none z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
            I
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-lg">
            IELTS<span className="text-cyan-700 font-semibold ml-1">CDI</span>
          </span>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-slate-700 truncate max-w-[280px]">
            {testTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border font-mono font-bold text-lg transition-colors ${
            isLowTime
              ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-600' : 'text-slate-500'}`} />
          <span>{formatTime(timeRemaining)}</span>
          <span className="text-xs font-sans font-normal text-slate-500 ml-1">left</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50">
          {syncStatus === 'saved' && (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Saved</span>
            </>
          )}
          {syncStatus === 'saving' && (
            <>
              <RefreshCw className="w-3 h-3 text-cyan-600 animate-spin" />
              <span className="text-cyan-700">Saving...</span>
            </>
          )}
          {syncStatus === 'offline' && (
            <>
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span className="text-amber-700 font-semibold">Offline (queueing)</span>
            </>
          )}
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setFontSize('sm')}
            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
              fontSize === 'sm' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => setFontSize('md')}
            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
              fontSize === 'md' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => setFontSize('lg')}
            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
              fontSize === 'lg' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            A+
          </button>
        </div>
      </div>
    </header>
  );
};
