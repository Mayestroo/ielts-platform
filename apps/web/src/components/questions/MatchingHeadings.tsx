'use client';

import React from 'react';
import { useExamStore } from '@/stores/examStore';
import type { Question } from '@ielts/shared-types';

interface Props {
  question: Question;
}

export const MatchingHeadings: React.FC<Props> = ({ question }) => {
  const payload = question.payload as any;
  const answerRecord = useExamStore((s) => s.answers[question.id]);
  const setAnswer = useExamStore((s) => s.setAnswer);
  const focusedId = useExamStore((s) => s.focusedQuestionId);
  const setFocused = useExamStore((s) => s.setFocusedQuestion);

  const selectedHeadingId = answerRecord?.value as string | undefined;
  const isFocused = focusedId === question.id;

  const handleSelect = (headingId: string) => {
    setFocused(question.id);
    setAnswer(question.id, headingId);
  };

  return (
    <div
      id={`question-${question.question_number}`}
      onClick={() => setFocused(question.id)}
      className={`p-4 rounded-xl border transition-all ${
        isFocused
          ? 'border-cyan-600 bg-cyan-50/20 shadow-sm ring-1 ring-cyan-500'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-sm flex items-center justify-center">
          {question.question_number}
        </span>
        <span className="text-base font-bold text-slate-800">
          {payload.paragraph_label}
        </span>
      </div>

      <div className="space-y-1.5 ml-10">
        {payload.headings?.map((heading: any) => {
          const isSelected = selectedHeadingId === heading.id;
          return (
            <button
              key={heading.id}
              type="button"
              onClick={() => handleSelect(heading.id)}
              className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg border text-sm transition-all ${
                isSelected
                  ? 'border-cyan-600 bg-cyan-50 font-medium text-cyan-950 ring-1 ring-cyan-600'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-slate-700'
              }`}
            >
              <span className="font-bold text-slate-600 min-w-[24px]">
                {heading.roman_numeral}.
              </span>
              <span className="leading-snug">{heading.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
