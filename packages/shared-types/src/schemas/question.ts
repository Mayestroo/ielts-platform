import { z } from 'zod';

export const ModuleTypeSchema = z.enum(['listening', 'reading', 'writing', 'speaking']);
export type ModuleType = z.infer<typeof ModuleTypeSchema>;

export const TestTierSchema = z.enum(['free', 'gold', 'premium']);
export type TestTier = z.infer<typeof TestTierSchema>;

export const TestFormatSchema = z.enum(['full', 'split']);
export type TestFormat = z.infer<typeof TestFormatSchema>;

export const QuestionTypeSchema = z.enum([
  'multiple_choice_single',
  'multiple_choice_multi',
  'matching_headings',
  'matching_information',
  'sentence_completion',
  'summary_completion',
  'diagram_labeling',
  'true_false_not_given',
  'yes_no_not_given',
  'short_answer',
  'writing_task_1',
  'writing_task_2',
]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

// Individual Question Payload Schemas
export const MultipleChoiceOptionSchema = z.object({
  id: z.string(),
  label: z.string(), // e.g. "A", "B", "C"
  text: z.string(),
});
export type MultipleChoiceOption = z.infer<typeof MultipleChoiceOptionSchema>;

export const MultipleChoiceSinglePayloadSchema = z.object({
  type: z.literal('multiple_choice_single'),
  prompt: z.string(),
  options: z.array(MultipleChoiceOptionSchema),
  correct_option_id: z.string(),
});

export const MultipleChoiceMultiPayloadSchema = z.object({
  type: z.literal('multiple_choice_multi'),
  prompt: z.string(),
  options: z.array(MultipleChoiceOptionSchema),
  correct_option_ids: z.array(z.string()),
  max_selections: z.number().int().positive().default(2),
});

export const MatchingHeadingsPayloadSchema = z.object({
  type: z.literal('matching_headings'),
  paragraph_label: z.string(), // e.g. "Paragraph A"
  headings: z.array(
    z.object({
      id: z.string(),
      roman_numeral: z.string(), // e.g. "i", "ii", "iii"
      text: z.string(),
    })
  ),
  correct_heading_id: z.string(),
});

export const MatchingInformationPayloadSchema = z.object({
  type: z.literal('matching_information'),
  statement: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      text: z.string(),
    })
  ),
  correct_option_id: z.string(),
});

export const SentenceCompletionPayloadSchema = z.object({
  type: z.literal('sentence_completion'),
  sentence_prefix: z.string().default(''),
  sentence_suffix: z.string().default(''),
  accepted_answers: z.array(z.string()).min(1),
  max_words: z.number().int().positive().default(2),
  max_numbers: z.number().int().nonnegative().optional(),
});

export const SummaryCompletionPayloadSchema = z.object({
  type: z.literal('summary_completion'),
  summary_context: z.string(), // Text with [BLANK] marker
  word_bank: z
    .array(
      z.object({
        id: z.string(),
        word: z.string(),
      })
    )
    .optional(),
  accepted_answers: z.array(z.string()).min(1),
  max_words: z.number().int().positive().default(1),
});

export const DiagramHotspotPayloadSchema = z.object({
  type: z.literal('diagram_labeling'),
  image_url: z.string(),
  pin_label: z.string(), // e.g. "14" or "A"
  pin_x: z.number().min(0).max(100), // percentage
  pin_y: z.number().min(0).max(100), // percentage
  accepted_answers: z.array(z.string()).min(1),
  max_words: z.number().int().positive().default(2),
});

export const TrueFalseNotGivenPayloadSchema = z.object({
  type: z.literal('true_false_not_given'),
  statement: z.string(),
  correct_answer: z.enum(['TRUE', 'FALSE', 'NOT GIVEN']),
});

export const YesNoNotGivenPayloadSchema = z.object({
  type: z.literal('yes_no_not_given'),
  statement: z.string(),
  correct_answer: z.enum(['YES', 'NO', 'NOT GIVEN']),
});

export const ShortAnswerPayloadSchema = z.object({
  type: z.literal('short_answer'),
  question_text: z.string(),
  accepted_answers: z.array(z.string()).min(1),
  max_words: z.number().int().positive().default(3),
});

export const WritingTask1PayloadSchema = z.object({
  type: z.literal('writing_task_1'),
  prompt: z.string(),
  chart_image_url: z.string().optional(),
  min_words: z.number().int().positive().default(150),
});

export const WritingTask2PayloadSchema = z.object({
  type: z.literal('writing_task_2'),
  prompt: z.string(),
  min_words: z.number().int().positive().default(250),
});

// Discriminated Union of all question payloads
export const QuestionPayloadSchema = z.discriminatedUnion('type', [
  MultipleChoiceSinglePayloadSchema,
  MultipleChoiceMultiPayloadSchema,
  MatchingHeadingsPayloadSchema,
  MatchingInformationPayloadSchema,
  SentenceCompletionPayloadSchema,
  SummaryCompletionPayloadSchema,
  DiagramHotspotPayloadSchema,
  TrueFalseNotGivenPayloadSchema,
  YesNoNotGivenPayloadSchema,
  ShortAnswerPayloadSchema,
  WritingTask1PayloadSchema,
  WritingTask2PayloadSchema,
]);
export type QuestionPayload = z.infer<typeof QuestionPayloadSchema>;

// Full Question DTO
export const QuestionSchema = z.object({
  id: z.string(),
  test_part_id: z.string(),
  question_group_id: z.string().optional().nullable(),
  question_number: z.number().int().positive(), // Global test numbering 1..40
  question_type: QuestionTypeSchema,
  payload: QuestionPayloadSchema,
  points: z.number().int().positive().default(1),
  explanation_text: z.string().default(''),
});
export type Question = z.infer<typeof QuestionSchema>;

// Question Group DTO
export const QuestionGroupSchema = z.object({
  id: z.string(),
  test_part_id: z.string(),
  instruction_text: z.string(),
  range_label: z.string(), // e.g. "Questions 1-5"
  question_type: QuestionTypeSchema,
  answer_pool_shared: z.boolean().default(false),
  start_question_number: z.number().int().positive(),
  end_question_number: z.number().int().positive(),
});
export type QuestionGroup = z.infer<typeof QuestionGroupSchema>;

// Test Part DTO
export const TestPartSchema = z.object({
  id: z.string(),
  test_id: z.string(),
  module: ModuleTypeSchema,
  part_number: z.number().int().positive(), // 1..4 Listening, 1..3 Reading, 1..2 Writing
  title: z.string(),
  audio_url: z.string().optional().nullable(),
  passage_text: z.string().optional().nullable(), // Rich text / markdown passage
  order_index: z.number().int().nonnegative(),
  question_groups: z.array(QuestionGroupSchema).default([]),
  questions: z.array(QuestionSchema).default([]),
});
export type TestPart = z.infer<typeof TestPartSchema>;
