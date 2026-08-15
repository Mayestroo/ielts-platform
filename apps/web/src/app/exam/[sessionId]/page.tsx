'use client';

import React, { useEffect, useState, use } from 'react';
import { useExamStore } from '@/stores/examStore';
import { useAutosaveSync } from '@/hooks/useAutosaveSync';
import { useControlSocket } from '@/hooks/useControlSocket';
import { ExamHeader } from '@/components/exam/ExamHeader';
import { SplitResizer } from '@/components/exam/SplitResizer';
import { PassageViewer } from '@/components/exam/PassageViewer';
import { PartNavigator } from '@/components/exam/PartNavigator';
import { AudioPlayerBar } from '@/components/exam/AudioPlayerBar';
import { SubmitModal } from '@/components/exam/SubmitModal';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { Loader2, AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default function ExamPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const session = useExamStore((s) => s.session);
  const currentPart = useExamStore((s) => s.currentPart);

  // 1. Attach Real-Time Control Channel WebSocket
  useControlSocket(sessionId);

  // 2. Attach Offline Write-Ahead Autosave Synchronization
  useAutosaveSync(sessionId);

  // 3. Fetch Session Data on mount
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch(`http://localhost:4000/api/exam-sessions/${sessionId}`);
        if (!res.ok) {
          throw new Error(`Failed to load exam session: ${res.statusText}`);
        }
        const data = await res.json();
        if (isMounted) {
          await useExamStore.getState().initSession(data);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred while loading the exam.');
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 text-cyan-700 animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Loading authentic IELTS exam session...</p>
      </div>
    );
  }

  if (error || !session || !currentPart) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md w-full text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Exam Session Error</h2>
          <p className="text-sm text-slate-600 mb-6">{error || 'Could not load exam data.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const leftContent = (
    <PassageViewer
      title={currentPart.title}
      passageText={currentPart.passage_text}
      partId={currentPart.id}
    />
  );

  const rightContent = (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {currentPart.question_groups?.length > 0 ? (
        currentPart.question_groups.map((group) => {
          const groupQuestions = currentPart.questions.filter(
            (q) => q.question_group_id === group.id
          );

          return (
            <div key={group.id} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 block mb-1">
                  {group.range_label}
                </span>
                <p className="text-sm font-semibold leading-relaxed">
                  {group.instruction_text}
                </p>
              </div>

              <div className="space-y-4">
                {groupQuestions.map((q) => (
                  <QuestionRenderer key={q.id} question={q} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="space-y-4">
          {currentPart.questions?.map((q) => (
            <QuestionRenderer key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );

  const isListening = currentPart.module?.toLowerCase() === 'listening';

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
      <ExamHeader />

      {isListening && (
        <AudioPlayerBar
          audioUrl={currentPart.audio_url}
          isOfflineMock={session.session_type === 'offline_mock'}
        />
      )}

      <main className="flex-1 flex overflow-hidden">
        <SplitResizer leftContent={leftContent} rightContent={rightContent} />
      </main>

      <PartNavigator />
      <SubmitModal />
    </div>
  );
}
