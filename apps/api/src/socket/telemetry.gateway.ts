import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@WebSocketGateway({
  namespace: '/telemetry',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class TelemetryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TelemetryGateway.name);
  private infractionMap = new Map<string, number>();

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Telemetry Channel: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Telemetry Channel: ${client.id}`);
  }

  @SubscribeMessage('admin:join_proctor_room')
  handleAdminJoin(@ConnectedSocket() client: Socket) {
    client.join('admin_proctors');
    this.logger.log(`Admin proctor joined monitoring room: ${client.id}`);
    return { success: true };
  }

  @SubscribeMessage('telemetry:heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { session_id: string; timestamp: number }
  ) {
    const { session_id, timestamp } = payload;
    if (!session_id) return;

    await this.redis.recordHeartbeat(session_id);

    // Notify admins of candidate presence
    this.server.to('admin_proctors').emit('admin:candidate_heartbeat', {
      session_id,
      timestamp,
      is_online: true,
    });
  }

  @SubscribeMessage('telemetry:focus_lost')
  async handleFocusLost(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { session_id: string; reason: string; timestamp: number }
  ) {
    const { session_id, reason, timestamp } = payload;
    if (!session_id) return;

    const currentInfractions = (this.infractionMap.get(session_id) || 0) + 1;
    this.infractionMap.set(session_id, currentInfractions);

    this.logger.warn(
      `Candidate focus loss [Infraction #${currentInfractions}] in session ${session_id}: ${reason}`
    );

    // Fetch candidate info
    const session = await this.prisma.examSession.findUnique({
      where: { id: session_id },
      include: { user: { select: { full_name: true, email: true } } },
    });

    const candidateName = session?.user?.full_name || 'Candidate';

    // Broadcast candidate update to proctor dashboard
    this.server.to('admin_proctors').emit('admin:candidate_infraction', {
      session_id,
      candidate_name: candidateName,
      infraction_count: currentInfractions,
      reason,
      timestamp,
    });

    // Escalation gate: 3+ infractions emit high-priority proctor alert & AuditLog
    if (currentInfractions >= 3) {
      this.server.to('admin_proctors').emit('admin:proctor_alert', {
        session_id,
        candidate_name: candidateName,
        infraction_count: currentInfractions,
        alert_type: 'EXCESSIVE_FOCUS_LOSS',
        timestamp,
      });

      await this.prisma.auditLog.create({
        data: {
          actor_id: session?.user_id,
          action: 'PROCTOR_INFRACTION_ALERT',
          entity: 'ExamSession',
          entity_id: session_id,
          meta: {
            infraction_count: currentInfractions,
            reason,
            timestamp,
          },
        },
      });
    }

    return { infraction_count: currentInfractions };
  }

  @SubscribeMessage('telemetry:fullscreen_exit')
  async handleFullscreenExit(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { session_id: string; timestamp: number }
  ) {
    return this.handleFocusLost(client, {
      session_id: payload.session_id,
      reason: 'Fullscreen exited',
      timestamp: payload.timestamp,
    });
  }

  getInfractions(sessionId: string): number {
    return this.infractionMap.get(sessionId) || 0;
  }
}
