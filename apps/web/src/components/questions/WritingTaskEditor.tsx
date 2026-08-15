'use client';

import React from 'react';
import { useExamStore } from '@/stores/examStore';
import { countIELTSWords } from '@ielts/shared-types';
import type { Question } from '@ielts/shared-types';

interface Props {
  question: Question;
}

export const WritingTaskEditor: React.FC<Props> = ({ question }) => {
  const payload = question.payload as any;
  const answerRecord = useExamStore((s) => s.answers[question.id]);
  const setAnswer = useExamStore((s) => s.setAnswer);

  const text = (answerRecord?.value as string) || '';
  const wordCount = countIELTSWords(text);
  const minWords = payload.min_words || (payload.type === 'writing_task_1' ? 150 : 250);
  const isRequirementMet = wordCount >= minWords;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswer(question.id, e.target.value);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">
            {payload.type === 'writing_task_1' ? 'Writing Task 1 Response' : 'Writing Task 2 Essay'}
          </h3>
          <p className="text-xs text-slate-500">
            Write at least {minWords} words in response to the task prompt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              isRequirementMet
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {wordCount} / {minWords} words
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Start typing your response here..."
          className="w-full h-full min-h-[400px] p-4 text-base text-slate-800 leading-relaxed rounded-lg border border-slate-200 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 outline-none resize-none font-sans"
        />
      </div>
    </div>
  );
};
