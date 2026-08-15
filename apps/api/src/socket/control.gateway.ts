import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@WebSocketGateway({
  namespace: '/control',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ControlGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ControlGateway.name);
  private timerInterval?: NodeJS.Timeout;
  private activeSessions = new Set<string>();

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit() {
    this.logger.log('Socket.IO Control Channel Gateway initialized');
    this.timerInterval = setInterval(() => {
      this.tickActiveTimers().catch((err) => {
        this.logger.error('Error ticking active timers', err);
      });
    }, 1000);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Control Channel: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Control Channel: ${client.id}`);
  }

  @SubscribeMessage('session:join')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { session_id: string }
  ) {
    const { session_id } = payload;
    if (!session_id) return;

    client.join(`session_${session_id}`);
    this.activeSessions.add(session_id);

    const timeRemaining = (await this.redis.getTimer(session_id)) ?? 3600;
    client.emit('timer:tick', { time_remaining: timeRemaining });
    this.logger.log(`Client ${client.id} joined session room: session_${session_id}`);
  }

  @SubscribeMessage('session:sync_timer')
  async handleSyncTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { session_id: string }
  ) {
    const { session_id } = payload;
    const timeRemaining = (await this.redis.getTimer(session_id)) ?? 3600;
    return { time_remaining: timeRemaining, audio_elapsed: 0 };
  }

  @SubscribeMessage('admin:add_time')
  async handleAddTime(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { session_id: string; added_seconds: number }
  ) {
    const { session_id, added_seconds } = payload;
    const newTime = await this.redis.addTimerSeconds(session_id, added_seconds);
    this.server.to(`session_${session_id}`).emit('session:add_time', {
      added_seconds,
      new_time_remaining: newTime,
    });
    return { success: true, new_time_remaining: newTime };
  }

  @SubscribeMessage('admin:force_submit')
  async handleForceSubmit(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { session_id: string; reason: string }
  ) {
    const { session_id, reason } = payload;
    this.server.to(`session_${session_id}`).emit('session:force_submit', { reason });
    return { success: true };
  }

  private async tickActiveTimers() {
    if (this.activeSessions.size === 0) return;

    const adapter: any = (this.server as any)?.adapter || (this.server as any)?.sockets?.adapter;
    const rooms = adapter?.rooms;

    for (const sessionId of Array.from(this.activeSessions)) {
      const room = rooms?.get(`session_${sessionId}`);
      if (!room || room.size === 0) {
        this.activeSessions.delete(sessionId);
        continue;
      }

      const remaining = await this.redis.decrementTimer(sessionId, 1);
      this.server.to(`session_${sessionId}`).emit('timer:tick', {
        time_remaining: remaining,
      });

      if (remaining <= 0) {
        this.server.to(`session_${sessionId}`).emit('session:force_submit', {
          reason: 'Time expired',
        });
        this.activeSessions.delete(sessionId);
      }
    }
  }
}
