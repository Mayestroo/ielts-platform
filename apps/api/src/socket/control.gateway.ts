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
import { SocketBroadcasterService } from './socket-broadcaster.service.js';
import { ProctoringAuthorityService } from '../proctoring/proctoring-authority.service.js';

@WebSocketGateway({
  namespace: '/control',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ControlGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ControlGateway.name);
  private timerInterval?: NodeJS.Timeout;

  constructor(
    private readonly broadcaster: SocketBroadcasterService,
    private readonly proctoring: ProctoringAuthorityService,
  ) {}

  afterInit(server: Server) {
    this.broadcaster.setControlServer(server);
    this.startGlobalTimerTicker();
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
    if (!session_id) return { success: false, error: 'session_id required' };

    const room = `session_${session_id}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined session room: ${room}`);

    const remaining = await this.proctoring.getTimeRemaining(session_id);
    return { success: true, time_remaining: remaining };
  }

  @SubscribeMessage('session:sync_timer')
  async handleSyncTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { session_id: string }
  ) {
    const { session_id } = payload;
    const remaining = await this.proctoring.getTimeRemaining(session_id);
    return { time_remaining: remaining, audio_elapsed: 0 };
  }

  private startGlobalTimerTicker() {
    this.timerInterval = setInterval(async () => {
      const adapter: any =
        (this.server as any)?.adapter || (this.server as any)?.sockets?.adapter;
      const rooms: Map<string, Set<string>> | undefined = adapter?.rooms;
      if (!rooms) return;

      for (const [roomName, sockets] of rooms.entries()) {
        if (roomName.startsWith('session_') && sockets.size > 0) {
          const sessionId = roomName.replace('session_', '');
          const remaining = await this.proctoring.getTimeRemaining(sessionId);
          this.broadcaster.emitTimerTick(sessionId, remaining);
        }
      }
    }, 1000);
  }
}
