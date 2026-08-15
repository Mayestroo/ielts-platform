import Dexie, { type EntityTable } from 'dexie';
import type { AnswerValue, HighlightAnnotation } from '@ielts/shared-types';

export interface QueuedAnswer {
  id?: number;
  session_id: string;
  question_id: string;
  answer_value: AnswerValue;
  answer_version: number;
  updated_at: number;
  synced: number; // 0 = unsynced, 1 = synced
}

export interface CachedSession {
  id: string;
  data: any;
  updated_at: number;
}

export class IeltsExamDB extends Dexie {
  answersQueue!: EntityTable<QueuedAnswer, 'id'>;
  highlights!: EntityTable<HighlightAnnotation, 'id'>;
  sessionCache!: EntityTable<CachedSession, 'id'>;

  constructor() {
    super('IeltsExamDB');
    this.version(1).stores({
      answersQueue: '++id, [session_id+question_id], session_id, synced, updated_at',
      highlights: 'id, session_id, part_id',
      sessionCache: 'id, updated_at',
    });
  }
}

export const examDb = new IeltsExamDB();
