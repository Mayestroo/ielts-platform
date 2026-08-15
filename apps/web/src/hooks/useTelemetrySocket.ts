import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

interface TelemetryOptions {
  sessionId?: string;
  onInfraction?: (infractionCount: number, reason: string) => void;
}

export function useTelemetrySocket({ sessionId, onInfraction }: TelemetryOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [infractionCount, setInfractionCount] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    const socket = io('http://localhost:4000/telemetry', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // 1. Periodic Heartbeat (every 5 seconds)
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('telemetry:heartbeat', {
          session_id: sessionId,
          timestamp: Date.now(),
        });
      }
    }, 5000);

    const reportFocusLoss = (reason: string) => {
      const now = Date.now();
      socket.emit(
        'telemetry:focus_lost',
        { session_id: sessionId, reason, timestamp: now },
        (res?: { infraction_count: number }) => {
          const newCount = res?.infraction_count || infractionCount + 1;
          setInfractionCount(newCount);
          onInfraction?.(newCount, reason);
        }
      );
    };

    // 2. Tab Visibility Change Listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportFocusLoss('Switched tab or minimized window');
      }
    };

    // 3. Window Blur Listener
    const handleWindowBlur = () => {
      reportFocusLoss('Window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      socket.disconnect();
    };
  }, [sessionId, onInfraction, infractionCount]);

  return { socket: socketRef, infractionCount };
}
