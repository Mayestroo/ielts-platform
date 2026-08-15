'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { io, type Socket } from 'socket.io-client';
import {
  ShieldAlert,
  Users,
  Clock,
  Wifi,
  AlertTriangle,
  PlusCircle,
  XCircle,
  Activity,
  ArrowLeft,
  RefreshCw,
  Eye,
} from 'lucide-react';
import type { CandidateLiveState } from '@ielts/shared-types';

export default function AdminLiveMonitorPage() {
  const [candidates, setCandidates] = useState<CandidateLiveState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<
    Array<{ id: string; candidate_name: string; alert_type: string; count: number; time: string }>
  >([]);

  // Fetch initial candidates list
  const loadCandidates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:4000/api/admin/live-sessions');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();

    // Connect to Telemetry Channel as Admin Proctor
    const socket: Socket = io('http://localhost:4000/telemetry', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Admin proctor connected to /telemetry');
      socket.emit('admin:join_proctor_room');
    });

    // Listen for real-time candidate heartbeats
    socket.on('admin:candidate_heartbeat', (payload: { session_id: string; timestamp: number }) => {
      setCandidates((prev) =>
        prev.map((c) =>
          c.session_id === payload.session_id
            ? { ...c, is_online: true, last_heartbeat_at: payload.timestamp }
            : c
        )
      );
    });

    // Listen for candidate infraction updates
    socket.on(
      'admin:candidate_infraction',
      (payload: { session_id: string; candidate_name: string; infraction_count: number; reason: string }) => {
        setCandidates((prev) =>
          prev.map((c) =>
            c.session_id === payload.session_id
              ? { ...c, infraction_count: payload.infraction_count, last_event: payload.reason }
              : c
          )
        );
      }
    );

    // Listen for critical proctor alerts (3+ infractions)
    socket.on(
      'admin:proctor_alert',
      (payload: { session_id: string; candidate_name: string; infraction_count: number; alert_type: string }) => {
        setAlerts((prev) => [
          {
            id: `alert_${Date.now()}`,
            candidate_name: payload.candidate_name,
            alert_type: payload.alert_type,
            count: payload.infraction_count,
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 4),
        ]);
      }
    );

    // Local 1-second countdown ticker for candidate timers
    const timerInterval = setInterval(() => {
      setCandidates((prev) =>
        prev.map((c) => ({
          ...c,
          time_remaining: Math.max(0, c.time_remaining - 1),
        }))
      );
    }, 1000);

    return () => {
      clearInterval(timerInterval);
      socket.disconnect();
    };
  }, []);

  const handleAddTime = async (sessionId: string, seconds: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/admin/sessions/${sessionId}/add-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ added_seconds: seconds }),
      });
      if (res.ok) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.session_id === sessionId
              ? { ...c, time_remaining: c.time_remaining + seconds }
              : c
          )
        );
      }
    } catch (err) {
      alert('Failed to add time.');
    }
  };

  const handleForceSubmit = async (sessionId: string, name: string) => {
    if (confirm(`Are you sure you want to force terminate and submit ${name}'s exam?`)) {
      try {
        const res = await fetch(`http://localhost:4000/api/admin/sessions/${sessionId}/force-submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Proctor Force Termination' }),
        });
        if (res.ok) {
          setCandidates((prev) => prev.filter((c) => c.session_id !== sessionId));
        }
      } catch (err) {
        alert('Failed to force submit.');
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const totalInfractions = candidates.reduce((acc, c) => acc + (c.infraction_count || 0), 0);
  const flaggedCount = candidates.filter((c) => (c.infraction_count || 0) >= 3).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950 px-8 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Portal</span>
          </Link>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-white">
              IELTS Admin <span className="text-rose-500 font-semibold">Live Proctor Monitor</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadCandidates}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>WebSocket Live Stream Active</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Active Candidates
              </span>
              <span className="text-2xl font-black text-white">{candidates.length}</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Focus Infractions
              </span>
              <span className="text-2xl font-black text-amber-400">{totalInfractions}</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Flagged for Cheating (3+)
              </span>
              <span className="text-2xl font-black text-rose-400">{flaggedCount}</span>
            </div>
          </div>
        </div>

        {/* Live Proctor Alerts Toast Bar */}
        {alerts.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Real-Time High Priority Alerts</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-rose-900/50 border border-rose-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{a.candidate_name}</span>
                    <span className="text-rose-200">
                      Excessive window focus loss ({a.count} infractions)
                    </span>
                  </div>
                  <span className="font-mono text-rose-300 text-[10px]">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Candidates Table & Remote Actions */}
        <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              <span>Candidate Live Supervision Grid</span>
            </h2>
            <span className="text-xs text-slate-400">
              Updates in real time over Socket.IO Control & Telemetry channels
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Time Remaining</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Infractions</th>
                  <th className="px-6 py-4 text-right">Proctor Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {candidates.map((c) => {
                  const isFlagged = (c.infraction_count || 0) >= 3;
                  const isWarning = (c.infraction_count || 0) > 0 && !isFlagged;

                  return (
                    <tr
                      key={c.session_id}
                      className={`hover:bg-slate-700/40 transition-colors ${
                        isFlagged ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      {/* Candidate Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 text-cyan-400 font-bold text-xs flex items-center justify-center border border-slate-600">
                            {c.candidate_name?.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{c.candidate_name}</span>
                            <span className="text-xs font-mono text-slate-400">{c.session_id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Module */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-700">
                          {c.current_module}
                        </span>
                      </td>

                      {/* Time Remaining */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-mono font-bold text-slate-200">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{formatTime(c.time_remaining)}</span>
                        </div>
                      </td>

                      {/* Online Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              c.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                            }`}
                          />
                          <span className="text-xs font-medium">
                            {c.is_online ? 'Active' : 'Reconnecting'}
                          </span>
                        </div>
                      </td>

                      {/* Infractions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                              isFlagged
                                ? 'bg-rose-600 text-white border-rose-500 animate-bounce'
                                : isWarning
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-700 text-slate-300 border-slate-600'
                            }`}
                          >
                            {c.infraction_count || 0} Infraction(s)
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddTime(c.session_id, 300)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-all active:scale-95"
                            title="Add 5 Minutes"
                          >
                            +5m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddTime(c.session_id, 600)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-all active:scale-95"
                            title="Add 10 Minutes"
                          >
                            +10m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleForceSubmit(c.session_id, c.candidate_name)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-700 hover:bg-rose-600 text-white border border-rose-600 transition-all active:scale-95 flex items-center gap-1"
                            title="Force Submit Exam"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Force Submit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
