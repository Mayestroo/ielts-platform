'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, RotateCw, Headphones } from 'lucide-react';
import { useExamStore } from '@/stores/examStore';

interface Props {
  audioUrl?: string | null;
  isOfflineMock?: boolean;
}

export const AudioPlayerBar: React.FC<Props> = ({ audioUrl, isOfflineMock = false }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(!isOfflineMock);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const skipTime = (seconds: number) => {
    if (!audioRef.current || isOfflineMock) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) return null;

  return (
    <div className="h-14 bg-slate-900 text-white px-6 flex items-center justify-between shadow-lg select-none z-30">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        autoPlay={isOfflineMock}
      />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-sm">
          <Headphones className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-200 block">
            Listening Section Audio
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {formatTime(currentTime)} / {formatTime(duration || 1800)}
          </span>
        </div>
      </div>

      {!isOfflineMock && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => skipTime(-10)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
            title="Rewind 10s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shadow-sm transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => skipTime(10)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
            title="Forward 10s"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setVolume(parseFloat(e.target.value));
            setIsMuted(false);
          }}
          className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>
    </div>
  );
};
