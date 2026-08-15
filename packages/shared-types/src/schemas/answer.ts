import { z } from 'zod';

export const AnswerValueSchema = z.union([
  z.string(), // text input, single radio ID, TRUE/FALSE/NOT GIVEN
  z.array(z.string()), // multi checkboxes
  z.record(z.string()), // key-value for drag-and-drop mappings (e.g. { "blank-1": "word-id" })
  z.null(),
]);
export type AnswerValue = z.infer<typeof AnswerValueSchema>;

export const AnswerMutationSchema = z.object({
  question_id: z.string(),
  answer_value: AnswerValueSchema,
  answer_version: z.number().int().nonnegative(),
  updated_at: z.number(), // timestamp ms
});
export type AnswerMutation = z.infer<typeof AnswerMutationSchema>;

export const AnswerRecordSchema = z.object({
  id: z.string().optional(),
  session_id: z.string(),
  question_id: z.string(),
  answer_value: AnswerValueSchema,
  answer_version: z.number().int().nonnegative(),
  is_correct: z.boolean().optional().nullable(),
  autosaved_at: z.string(),
});
export type AnswerRecord = z.infer<typeof AnswerRecordSchema>;

export const AutosaveBatchRequestSchema = z.object({
  session_id: z.string(),
  answers: z.array(AnswerMutationSchema),
  client_timestamp: z.number(),
});
export type AutosaveBatchRequest = z.infer<typeof AutosaveBatchRequestSchema>;

export const AutosaveBatchResponseSchema = z.object({
  success: z.boolean(),
  persisted_versions: z.record(z.number()), // question_id -> version
  server_time_remaining: z.number(),
});
export type AutosaveBatchResponse = z.infer<typeof AutosaveBatchResponseSchema>;
