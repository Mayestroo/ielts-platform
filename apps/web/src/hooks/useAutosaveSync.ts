import { useEffect, useRef } from 'react';
import { useExamStore } from '@/stores/examStore';
import { examDb } from '@/stores/db';

export function useAutosaveSync(sessionId?: string) {
  const isFlushingRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const flushQueue = async () => {
      if (isFlushingRef.current) return;

      try {
        const pending = await examDb.answersQueue
          .where('session_id')
          .equals(sessionId)
          .and((item) => item.synced === 0)
          .toArray();

        if (pending.length === 0) return;

        isFlushingRef.current = true;
        useExamStore.getState().setSyncStatus('saving');

        const payload = {
          answers: pending.map((item) => ({
            question_id: item.question_id,
            answer_value: item.answer_value,
            answer_version: item.answer_version,
            updated_at: item.updated_at,
          })),
        };

        const res = await fetch(`http://localhost:4000/api/exam-sessions/${sessionId}/autosave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }

        const data = await res.json();
        if (data.persisted_versions) {
          await useExamStore.getState().reconcileServerVersions(data.persisted_versions);
        }
      } catch (err) {
        console.warn('Autosave sync failed, keeping in local write-ahead queue:', err);
        useExamStore.getState().setSyncStatus('offline');

        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          flushQueue();
        }, 3000);
      } finally {
        isFlushingRef.current = false;
      }
    };

    const interval = setInterval(flushQueue, 2000);

    const handleOnline = () => {
      console.log('Network restored. Flushing offline write-ahead buffer...');
      flushQueue();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [sessionId]);
}
