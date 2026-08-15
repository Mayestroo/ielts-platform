'use client';

import React from 'react';
import type { Question } from '@ielts/shared-types';
import { MultipleChoiceSingle } from './MultipleChoiceSingle';
import { TrueFalseNotGiven } from './TrueFalseNotGiven';
import { SentenceCompletion } from './SentenceCompletion';
import { MatchingHeadings } from './MatchingHeadings';
import { WritingTaskEditor } from './WritingTaskEditor';

interface Props {
  question: Question;
}

export const QuestionRenderer: React.FC<Props> = ({ question }) => {
  switch (question.question_type) {
    case 'multiple_choice_single':
    case 'multiple_choice_multi':
    case 'matching_information':
      return <MultipleChoiceSingle question={question} />;

    case 'true_false_not_given':
      return <TrueFalseNotGiven question={question} isYesNo={false} />;

    case 'yes_no_not_given':
      return <TrueFalseNotGiven question={question} isYesNo={true} />;

    case 'sentence_completion':
    case 'summary_completion':
    case 'short_answer':
      return <SentenceCompletion question={question} />;

    case 'matching_headings':
      return <MatchingHeadings question={question} />;

    case 'writing_task_1':
    case 'writing_task_2':
      return <WritingTaskEditor question={question} />;

    default:
      return (
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <p className="text-sm font-semibold text-slate-700">
            Question {question.question_number} ({question.question_type})
          </p>
        </div>
      );
  }
};
