import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';

@Injectable()
export class SocketBroadcasterService {
  private readonly logger = new Logger(SocketBroadcasterService.name);
  private controlServer?: Server;
  private telemetryServer?: Server;

  setControlServer(server: Server) {
    this.controlServer = server;
    this.logger.log('Control Channel Server registered in SocketBroadcaster');
  }

  setTelemetryServer(server: Server) {
    this.telemetryServer = server;
    this.logger.log('Telemetry Channel Server registered in SocketBroadcaster');
  }

  emitTimerTick(sessionId: string, timeRemaining: number) {
    this.controlServer?.to(`session_${sessionId}`).emit('timer:tick', {
      time_remaining: timeRemaining,
    });
  }

  emitTimeAdded(sessionId: string, addedSeconds: number, newTimeRemaining: number) {
    this.controlServer?.to(`session_${sessionId}`).emit('session:add_time', {
      added_seconds: addedSeconds,
      new_time_remaining: newTimeRemaining,
    });
  }

  emitForceSubmit(sessionId: string, reason: string) {
    this.controlServer?.to(`session_${sessionId}`).emit('session:force_submit', {
      reason,
    });
  }

  emitCandidateHeartbeat(sessionId: string, timestamp: number) {
    this.telemetryServer?.to('admin_proctors').emit('admin:candidate_heartbeat', {
      session_id: sessionId,
      timestamp,
      is_online: true,
    });
  }

  emitCandidateInfraction(
    sessionId: string,
    candidateName: string,
    infractionCount: number,
    reason: string,
    timestamp: number
  ) {
    this.telemetryServer?.to('admin_proctors').emit('admin:candidate_infraction', {
      session_id: sessionId,
      candidate_name: candidateName,
      infraction_count: infractionCount,
      reason,
      timestamp,
    });
  }

  emitProctorAlert(
    sessionId: string,
    candidateName: string,
    infractionCount: number,
    alertType: string,
    timestamp: number
  ) {
    this.telemetryServer?.to('admin_proctors').emit('admin:proctor_alert', {
      session_id: sessionId,
      candidate_name: candidateName,
      infraction_count: infractionCount,
      alert_type: alertType,
      timestamp,
    });
  }

  isSessionActive(sessionId: string): boolean {
    const adapter: any = (this.controlServer as any)?.adapter || (this.controlServer as any)?.sockets?.adapter;
    const room = adapter?.rooms?.get(`session_${sessionId}`);
    return Boolean(room && room.size > 0);
  }
}
