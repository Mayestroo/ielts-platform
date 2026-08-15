'use client';

import React from 'react';
import { useExamStore } from '@/stores/examStore';
import type { Question } from '@ielts/shared-types';

interface Props {
  question: Question;
}

export const MultipleChoiceSingle: React.FC<Props> = ({ question }) => {
  const payload = question.payload as any;
  const answerRecord = useExamStore((s) => s.answers[question.id]);
  const setAnswer = useExamStore((s) => s.setAnswer);
  const focusedId = useExamStore((s) => s.focusedQuestionId);
  const setFocused = useExamStore((s) => s.setFocusedQuestion);

  const selectedOptionId = answerRecord?.value as string | undefined;
  const isFocused = focusedId === question.id;

  const handleSelect = (optionId: string) => {
    setFocused(question.id);
    setAnswer(question.id, optionId);
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
        <p className="text-base font-medium text-slate-900 leading-snug pt-0.5">
          {payload.prompt}
        </p>
      </div>

      <div className="space-y-2 ml-10">
        {payload.options?.map((opt: any) => {
          const isSelected = selectedOptionId === opt.id;
          return (
            <label
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'border-cyan-700 bg-cyan-50/60 font-medium text-cyan-950 ring-1 ring-cyan-700'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-800'
              }`}
            >
              <input
                type="radio"
                name={`q_${question.id}`}
                checked={isSelected}
                onChange={() => handleSelect(opt.id)}
                className="w-4 h-4 text-cyan-700 focus:ring-cyan-600"
              />
              <span className="font-bold text-slate-700 w-5">{opt.label}</span>
              <span className="text-sm leading-relaxed">{opt.text}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
