'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  infractionCount: number;
  reason?: string;
  onDismiss: () => void;
}

export const InfractionWarningModal: React.FC<Props> = ({
  isOpen,
  infractionCount,
  reason,
  onDismiss,
}) => {
  if (!isOpen) return null;

  const isFinalWarning = infractionCount === 2;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isFinalWarning ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isFinalWarning ? <ShieldAlert className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
          </div>
          <div>
            <span
              className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isFinalWarning ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              Warning {infractionCount} of 2
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              {isFinalWarning ? 'Final Proctor Warning' : 'Exam Window Focus Lost'}
            </h3>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 space-y-2 mb-6 leading-relaxed">
          <p>
            {reason ? (
              <span className="font-semibold text-slate-900">Activity detected: {reason}.</span>
            ) : (
              'You switched away from the active examination window.'
            )}
          </p>
          <p className="text-xs text-slate-500">
            Per IELTS regulations, candidates must remain on the test screen. Continued navigation away
            from the exam will flag your session for manual supervisor review and potential cancellation.
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-95 ${
            isFinalWarning ? 'bg-rose-700 hover:bg-rose-800' : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>I Understand & Return to Exam</span>
        </button>
      </div>
    </div>
  );
};
