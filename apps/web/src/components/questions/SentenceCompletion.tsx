'use client';

import React from 'react';
import { useExamStore } from '@/stores/examStore';
import type { Question } from '@ielts/shared-types';

interface Props {
  question: Question;
}

export const SentenceCompletion: React.FC<Props> = ({ question }) => {
  const payload = question.payload as any;
  const answerRecord = useExamStore((s) => s.answers[question.id]);
  const setAnswer = useExamStore((s) => s.setAnswer);
  const focusedId = useExamStore((s) => s.focusedQuestionId);
  const setFocused = useExamStore((s) => s.setFocusedQuestion);

  const value = (answerRecord?.value as string) || '';
  const isFocused = focusedId === question.id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(question.id, e.target.value);
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
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-sm flex items-center justify-center">
          {question.question_number}
        </span>
        <div className="text-base text-slate-900 leading-relaxed pt-0.5">
          {payload.sentence_prefix && <span>{payload.sentence_prefix} </span>}
          <input
            type="text"
            value={value}
            onFocus={() => setFocused(question.id)}
            onChange={handleChange}
            placeholder="Type answer here..."
            className="inline-block mx-1.5 px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 outline-none transition-all min-w-[140px]"
          />
          {payload.sentence_suffix && <span>{payload.sentence_suffix}</span>}
          {payload.max_words && (
            <span className="block text-xs font-semibold text-slate-500 mt-1.5">
              (NO MORE THAN {payload.max_words} WORDS)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
