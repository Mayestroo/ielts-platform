import { z } from 'zod';
import { ModuleTypeSchema } from './question';

export const SessionTypeSchema = z.enum(['self_practice', 'offline_mock']);
export type SessionType = z.infer<typeof SessionTypeSchema>;

export const SessionStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'paused_disconnected',
  'submitted',
  'force_submitted',
  'expired',
]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const ResultVisibilitySchema = z.enum(['immediate', 'admin_release']);
export type ResultVisibility = z.infer<typeof ResultVisibilitySchema>;

export const HighlightAnnotationSchema = z.object({
  id: z.string(),
  part_id: z.string(),
  start_offset: z.number().int().nonnegative(),
  end_offset: z.number().int().nonnegative(),
  color: z.enum(['yellow', 'green', 'blue', 'pink']).default('yellow'),
  text: z.string(),
});
export type HighlightAnnotation = z.infer<typeof HighlightAnnotationSchema>;

export const ExamSessionStateSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  session_type: SessionTypeSchema,
  status: SessionStatusSchema,
  current_module: ModuleTypeSchema,
  current_part_id: z.string(),
  unlocked_part_ids: z.array(z.string()),
  server_time_remaining: z.number().int().nonnegative(), // seconds
  total_duration_seconds: z.number().int().positive(),
  audio_elapsed_seconds: z.number().int().nonnegative().default(0),
  result_visibility: ResultVisibilitySchema,
  highlights: z.array(HighlightAnnotationSchema).default([]),
});
export type ExamSessionState = z.infer<typeof ExamSessionStateSchema>;

// Control Channel WebSocket Events
export interface ControlSocketServerToClientEvents {
  'timer:tick': (payload: { time_remaining: number; audio_elapsed?: number }) => void;
  'session:force_submit': (payload: { reason: string }) => void;
  'session:add_time': (payload: { added_seconds: number; new_time_remaining: number }) => void;
  'session:part_unlocked': (payload: { next_part_id: string; module: string }) => void;
  'session:revoked': (payload: { reason: string }) => void;
}

export interface ControlSocketClientToServerEvents {
  'session:join': (payload: { session_id: string }) => void;
  'session:sync_timer': (payload: { session_id: string }, callback: (res: { time_remaining: number; audio_elapsed: number }) => void) => void;
  'session:submit_part': (payload: { session_id: string; part_id: string }, callback: (res: { success: boolean; next_part_id?: string }) => void) => void;
  'session:submit_final': (payload: { session_id: string }, callback: (res: { success: boolean }) => void) => void;
}

// Telemetry Channel WebSocket Events
export interface TelemetrySocketEvents {
  'telemetry:heartbeat': (payload: { session_id: string; timestamp: number }) => void;
  'telemetry:visibility_change': (payload: { session_id: string; hidden: boolean; timestamp: number }) => void;
  'telemetry:fullscreen_exit': (payload: { session_id: string; timestamp: number }) => void;
}
