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
  namespace: '/telemetry',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class TelemetryGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TelemetryGateway.name);

  constructor(
    private readonly broadcaster: SocketBroadcasterService,
    private readonly proctoring: ProctoringAuthorityService,
  ) {}

  afterInit(server: Server) {
    this.broadcaster.setTelemetryServer(server);
  }

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
    if (!payload?.session_id) return;
    await this.proctoring.recordHeartbeat(payload.session_id);
  }

  @SubscribeMessage('telemetry:focus_lost')
  async handleFocusLost(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { session_id: string; reason: string; timestamp: number }
  ) {
    if (!payload?.session_id) return;
    const result = await this.proctoring.recordInfraction(payload.session_id, payload.reason);
    return { infraction_count: result.infractionCount };
  }

  @SubscribeMessage('telemetry:fullscreen_exit')
  async handleFullscreenExit(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { session_id: string; timestamp: number }
  ) {
    if (!payload?.session_id) return;
    const result = await this.proctoring.recordInfraction(
      payload.session_id,
      'Candidate exited fullscreen'
    );
    return { infraction_count: result.infractionCount };
  }
}
