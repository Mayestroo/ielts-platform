'use client';

import React, { useState, useMemo } from 'react';
import { useExamStore } from '@/stores/examStore';
import { Highlighter, Trash2, BookOpen } from 'lucide-react';

interface Props {
  title?: string;
  passageText?: string | null;
  partId: string;
}

export const PassageViewer: React.FC<Props> = ({ title, passageText, partId }) => {
  const highlights = useExamStore((s) => s.highlights);
  const partHighlights = useMemo(
    () => (highlights || []).filter((h) => h.part_id === partId),
    [highlights, partId]
  );

  const addHighlight = useExamStore((s) => s.addHighlight);
  const removeHighlight = useExamStore((s) => s.removeHighlight);
  const fontSize = useExamStore((s) => s.fontSize);

  const [selection, setSelection] = useState<{
    text: string;
    start: number;
    end: number;
    x: number;
    y: number;
  } | null>(null);

  const handleMouseUp = (e: React.MouseEvent) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length > 2) {
      setSelection({
        text,
        start: 0,
        end: text.length,
        x: e.clientX,
        y: e.clientY - 45,
      });
    }
  };

  const handleApplyHighlight = (color: 'yellow' | 'green' | 'pink') => {
    if (!selection) return;

    addHighlight({
      id: `hl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      part_id: partId,
      start_offset: 0,
      end_offset: selection.text.length,
      color,
      text: selection.text,
    });

    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-sm leading-relaxed';
      case 'lg':
        return 'text-lg leading-loose';
      default:
        return 'text-base leading-relaxed';
    }
  };

  return (
    <div
      onMouseUp={handleMouseUp}
      className="p-8 max-w-3xl mx-auto relative select-text"
    >
      <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-200">
        <BookOpen className="w-5 h-5 text-cyan-700" />
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {title || 'Reading Passage'}
        </h2>
      </div>

      {partHighlights.length > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-amber-50/50 border border-amber-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Highlighter className="w-3.5 h-3.5" />
              Your Highlighted Notes ({partHighlights.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {partHighlights.map((h) => (
              <span
                key={h.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-200/60 text-amber-950 border border-amber-300"
              >
                <span className="truncate max-w-[200px]">"{h.text}"</span>
                <button
                  type="button"
                  onClick={() => removeHighlight(h.id)}
                  className="text-amber-800 hover:text-rose-600 p-0.5 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={`text-slate-800 space-y-4 font-sans ${getFontSizeClass()}`}>
        {passageText ? (
          passageText.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-justify">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-slate-400 italic">No passage text for this part.</p>
        )}
      </div>

      {selection && (
        <div
          style={{
            position: 'fixed',
            left: `${selection.x}px`,
            top: `${selection.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 flex items-center gap-1 bg-slate-900 text-white p-1.5 rounded-xl shadow-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            type="button"
            onClick={() => handleApplyHighlight('yellow')}
            className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors flex items-center gap-1"
          >
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            Highlight
          </button>
        </div>
      )}
    </div>
  );
};
