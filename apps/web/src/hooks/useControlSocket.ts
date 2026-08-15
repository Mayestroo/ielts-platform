import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useExamStore } from '@/stores/examStore';

export function useControlSocket(sessionId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const socket = io('http://localhost:4000/control', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Control Channel. Joining room:', sessionId);
      socket.emit('session:join', { session_id: sessionId });
    });

    socket.on('timer:tick', (payload: { time_remaining: number }) => {
      useExamStore.getState().setTimeRemaining(payload.time_remaining);
    });

    socket.on('session:add_time', (payload: { added_seconds: number; new_time_remaining: number }) => {
      console.log(`Admin added ${payload.added_seconds} seconds to session.`);
      useExamStore.getState().setTimeRemaining(payload.new_time_remaining);
    });

    socket.on('session:force_submit', (payload: { reason: string }) => {
      alert(`Exam terminated by supervisor: ${payload.reason}`);
      window.location.reload();
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  return socketRef;
}
