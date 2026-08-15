'use client';

import React, { useState } from 'react';
import { useExamStore } from '@/stores/examStore';
import { AlertCircle, CheckCircle2, Award, ArrowRight } from 'lucide-react';

export const SubmitModal: React.FC = () => {
  const isOpen = useExamStore((s) => s.isSubmitModalOpen);
  const setOpen = useExamStore((s) => s.setSubmitModalOpen);
  const session = useExamStore((s) => s.session);
  const currentPart = useExamStore((s) => s.currentPart);
  const answers = useExamStore((s) => s.answers);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen || !session || !currentPart) return null;

  const totalQuestions = currentPart.questions?.length || 0;
  const answeredCount = currentPart.questions?.filter((q) => {
    const a = answers[q.id];
    return a && a.value !== null && a.value !== '' && (Array.isArray(a.value) ? a.value.length > 0 : true);
  }).length || 0;

  const unansweredCount = totalQuestions - answeredCount;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`http://localhost:4000/api/exam-sessions/${session.id}/submit`, {
        method: 'POST',
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Failed to submit exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {!result ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Ready to submit your exam?
                </h3>
                <p className="text-xs text-slate-500">
                  Please confirm before finalizing your submission.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">Answered questions:</span>
                <span className="font-bold text-emerald-700">{answeredCount} of {totalQuestions}</span>
              </div>

              {unansweredCount > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 text-amber-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>You have {unansweredCount} unanswered question(s).</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Return to Exam
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-cyan-700 text-white hover:bg-cyan-800 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-4">
              <Award className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-1">
              Exam Completed!
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Your test has been successfully submitted and evaluated.
            </p>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">Correct Answers:</span>
                <span className="font-bold text-slate-900">{result.correct_count} / {result.total_points}</span>
              </div>
              <div className="flex items-center justify-between text-base border-t border-slate-200 pt-3">
                <span className="text-slate-800 font-bold">Estimated IELTS Band:</span>
                <span className="text-2xl font-black text-cyan-700">{result.estimated_band}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.location.reload();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-md"
            >
              <span>Back to Overview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
