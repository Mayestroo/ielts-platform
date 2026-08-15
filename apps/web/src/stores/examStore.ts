import { create } from 'zustand';
import type {
  AnswerValue,
  ExamSessionState,
  Question,
  QuestionGroup,
  HighlightAnnotation,
} from '@ielts/shared-types';
import { examDb } from './db';

export type SyncStatus = 'saved' | 'saving' | 'offline';
export type FontSize = 'sm' | 'md' | 'lg';
export type ThemePalette = 'default' | 'soft-grey' | 'high-contrast';

interface ExamStoreState {
  session: ExamSessionState | null;
  testTitle: string;
  currentPart: {
    id: string;
    part_number: number;
    title: string;
    module: string;
    passage_text?: string | null;
    audio_url?: string | null;
    question_groups: QuestionGroup[];
    questions: Question[];
  } | null;
  allParts: Array<{
    id: string;
    part_number: number;
    title: string;
    module: string;
  }>;
  answers: Record<string, { value: AnswerValue; version: number }>;
  focusedQuestionId: string | null;
  highlights: HighlightAnnotation[];
  timeRemaining: number;
  syncStatus: SyncStatus;
  fontSize: FontSize;
  theme: ThemePalette;
  paneRatio: number;
  isSubmitting: boolean;
  isSubmitModalOpen: boolean;

  // Actions
  initSession: (data: any) => Promise<void>;
  setAnswer: (questionId: string, value: AnswerValue) => Promise<void>;
  reconcileServerVersions: (persistedVersions: Record<string, number>) => Promise<void>;
  setFocusedQuestion: (questionId: string | null) => void;
  addHighlight: (highlight: HighlightAnnotation) => Promise<void>;
  removeHighlight: (id: string) => Promise<void>;
  setTimeRemaining: (seconds: number) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setFontSize: (size: FontSize) => void;
  setTheme: (theme: ThemePalette) => void;
  setPaneRatio: (ratio: number) => void;
  setSubmitModalOpen: (open: boolean) => void;
}

export const useExamStore = create<ExamStoreState>((set, get) => ({
  session: null,
  testTitle: 'IELTS Examination',
  currentPart: null,
  allParts: [],
  answers: {},
  focusedQuestionId: null,
  highlights: [],
  timeRemaining: 3600,
  syncStatus: 'saved',
  fontSize: 'md',
  theme: 'default',
  paneRatio: 50,
  isSubmitting: false,
  isSubmitModalOpen: false,

  initSession: async (data: any) => {
    const sessionId = data.session.id;

    let queued: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        queued = await examDb.answersQueue
          .where('session_id')
          .equals(sessionId)
          .toArray();
      } catch (err) {
        console.warn('Dexie read skipped:', err);
      }
    }

    const mergedAnswers: Record<string, { value: AnswerValue; version: number }> = {
      ...(data.answers || {}),
    };

    for (const item of queued) {
      const existing = mergedAnswers[item.question_id];
      if (!existing || item.answer_version >= existing.version) {
        mergedAnswers[item.question_id] = {
          value: item.answer_value,
          version: item.answer_version,
        };
      }
    }

    const highlights: HighlightAnnotation[] = data.session.highlights || [];
    if (typeof window !== 'undefined' && highlights.length > 0) {
      try {
        await examDb.highlights.bulkPut(highlights);
      } catch (err) {
        // ignore
      }
    }

    set({
      session: data.session,
      testTitle: data.test?.title || 'IELTS Academic Test',
      currentPart: data.current_part,
      allParts: data.all_parts || [],
      answers: mergedAnswers,
      highlights: highlights,
      timeRemaining: data.session.server_time_remaining || 3600,
      focusedQuestionId: data.current_part?.questions?.[0]?.id || null,
    });
  },

  setAnswer: async (questionId: string, value: AnswerValue) => {
    const state = get();
    const session = state.session;
    if (!session) return;

    const currentRecord = state.answers[questionId];
    const newVersion = (currentRecord?.version || 0) + 1;
    const now = Date.now();

    set((prev) => ({
      answers: {
        ...prev.answers,
        [questionId]: {
          value,
          version: newVersion,
        },
      },
      syncStatus: 'saving',
    }));

    if (typeof window !== 'undefined') {
      try {
        await examDb.answersQueue.put({
          session_id: session.id,
          question_id: questionId,
          answer_value: value,
          answer_version: newVersion,
          updated_at: now,
          synced: 0,
        });
      } catch (err) {
        console.warn('IndexedDB write warning:', err);
      }
    }
  },

  reconcileServerVersions: async (persistedVersions: Record<string, number>) => {
    const session = get().session;
    if (!session) return;

    if (typeof window !== 'undefined') {
      for (const [questionId, version] of Object.entries(persistedVersions)) {
        try {
          await examDb.answersQueue
            .where('[session_id+question_id]')
            .equals([session.id, questionId])
            .modify({ synced: 1 });
        } catch (err) {
          // ignore
        }
      }
    }

    set({ syncStatus: 'saved' });
  },

  setFocusedQuestion: (questionId: string | null) => {
    set({ focusedQuestionId: questionId });
  },

  addHighlight: async (highlight: HighlightAnnotation) => {
    const session = get().session;
    if (!session) return;

    const updated = [...get().highlights, highlight];
    set({ highlights: updated });

    if (typeof window !== 'undefined') {
      try {
        await examDb.highlights.put(highlight);
      } catch (err) {
        // ignore
      }
    }

    fetch(`http://localhost:4000/api/exam-sessions/${session.id}/highlights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ highlights: updated }),
    }).catch(() => {});
  },

  removeHighlight: async (id: string) => {
    const session = get().session;
    if (!session) return;

    const updated = get().highlights.filter((h) => h.id !== id);
    set({ highlights: updated });

    if (typeof window !== 'undefined') {
      try {
        await examDb.highlights.delete(id);
      } catch (err) {
        // ignore
      }
    }

    fetch(`http://localhost:4000/api/exam-sessions/${session.id}/highlights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ highlights: updated }),
    }).catch(() => {});
  },

  setTimeRemaining: (seconds: number) => {
    set({ timeRemaining: Math.max(0, seconds) });
  },

  setSyncStatus: (status: SyncStatus) => {
    set({ syncStatus: status });
  },

  setFontSize: (size: FontSize) => {
    set({ fontSize: size });
  },

  setTheme: (theme: ThemePalette) => {
    set({ theme });
  },

  setPaneRatio: (ratio: number) => {
    const clamped = Math.min(80, Math.max(20, ratio));
    set({ paneRatio: clamped });
  },

  setSubmitModalOpen: (open: boolean) => {
    set({ isSubmitModalOpen: open });
  },
}));
