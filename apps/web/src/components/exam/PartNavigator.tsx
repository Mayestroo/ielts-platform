'use client';

import React from 'react';
import { useExamStore } from '@/stores/examStore';
import { CheckCircle2 } from 'lucide-react';

export const PartNavigator: React.FC = () => {
  const currentPart = useExamStore((s) => s.currentPart);
  const allParts = useExamStore((s) => s.allParts);
  const answers = useExamStore((s) => s.answers);
  const focusedId = useExamStore((s) => s.focusedQuestionId);
  const setFocused = useExamStore((s) => s.setFocusedQuestion);
  const setSubmitModalOpen = useExamStore((s) => s.setSubmitModalOpen);

  if (!currentPart) return null;

  const scrollToQuestion = (questionId: string, questionNumber: number) => {
    setFocused(questionId);
    const elem = document.getElementById(`question-${questionNumber}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <footer className="h-16 border-t border-slate-200 bg-white px-6 flex items-center justify-between z-20 shadow-md select-none">
      {/* Left: Part Navigation Tabs */}
      <div className="flex items-center gap-2">
        {allParts.map((part) => {
          const isActive = part.id === currentPart.id;
          return (
            <button
              key={part.id}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Part {part.part_number}
            </button>
          );
        })}
      </div>

      {/* Center: 1..N Question Badges Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60vw] py-1 px-2 scrollbar-none">
        {currentPart.questions?.map((q) => {
          const ans = answers[q.id];
          const hasAnswer =
            ans &&
            ans.value !== null &&
            ans.value !== '' &&
            (Array.isArray(ans.value) ? ans.value.length > 0 : true);

          const isFocused = focusedId === q.id;

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => scrollToQuestion(q.id, q.question_number)}
              className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all flex-shrink-0 ${
                hasAnswer
                  ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              } ${isFocused ? 'ring-2 ring-cyan-500 ring-offset-1 scale-105' : ''}`}
            >
              {q.question_number}
            </button>
          );
        })}
      </div>

      {/* Right: Submit Button */}
      <div>
        <button
          type="button"
          onClick={() => setSubmitModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-cyan-700 text-white hover:bg-cyan-800 shadow-sm transition-all active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4" />
          Submit Exam
        </button>
      </div>
    </footer>
  );
};
