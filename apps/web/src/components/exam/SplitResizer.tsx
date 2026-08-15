'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useExamStore } from '@/stores/examStore';

interface Props {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
}

export const SplitResizer: React.FC<Props> = ({ leftContent, rightContent }) => {
  const paneRatio = useExamStore((s) => s.paneRatio);
  const setPaneRatio = useExamStore((s) => s.setPaneRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const newRatio = (relativeX / containerRect.width) * 100;

      setPaneRatio(newRatio);
    },
    [isDragging, setPaneRatio]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex overflow-hidden w-full relative select-none"
    >
      {/* Left Content Pane (Passage / Source) */}
      <div
        style={{ width: `${paneRatio}%` }}
        className="h-full overflow-y-auto border-r border-slate-200 bg-white"
      >
        {leftContent}
      </div>

      {/* Draggable Resizer Bar */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-2.5 h-full cursor-col-resize flex items-center justify-center transition-colors z-10 select-none ${
          isDragging ? 'bg-cyan-600' : 'bg-slate-100 hover:bg-cyan-500/80'
        }`}
      >
        <div className="w-1 h-8 rounded-full bg-slate-300 pointer-events-none" />
      </div>

      {/* Right Content Pane (Questions) */}
      <div
        style={{ width: `${100 - paneRatio}%` }}
        className="h-full overflow-y-auto bg-slate-50/50"
      >
        {rightContent}
      </div>
    </div>
  );
};
