'use client';

import React from 'react';
import { useExamStore } from '@/stores/examStore';
import type { Question } from '@ielts/shared-types';

interface Props {
  question: Question;
  isYesNo?: boolean;
}

export const TrueFalseNotGiven: React.FC<Props> = ({ question, isYesNo = false }) => {
  const payload = question.payload as any;
  const answerRecord = useExamStore((s) => s.answers[question.id]);
  const setAnswer = useExamStore((s) => s.setAnswer);
  const focusedId = useExamStore((s) => s.focusedQuestionId);
  const setFocused = useExamStore((s) => s.setFocusedQuestion);

  const selectedValue = answerRecord?.value as string | undefined;
  const isFocused = focusedId === question.id;

  const options = isYesNo ? ['YES', 'NO', 'NOT GIVEN'] : ['TRUE', 'FALSE', 'NOT GIVEN'];

  const handleSelect = (val: string) => {
    setFocused(question.id);
    setAnswer(question.id, val);
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
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-sm flex items-center justify-center">
          {question.question_number}
        </span>
        <p className="text-base font-normal text-slate-900 leading-snug pt-0.5">
          {payload.statement}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 ml-10">
        {options.map((opt) => {
          const isSelected = selectedValue?.toUpperCase() === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                isSelected
                  ? 'border-cyan-700 bg-cyan-700 text-white shadow-sm ring-2 ring-cyan-200'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};
