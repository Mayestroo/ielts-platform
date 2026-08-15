import { Module, Global } from '@nestjs/common';
import { SocketBroadcasterService } from './socket-broadcaster.service.js';
import { ControlGateway } from './control.gateway.js';
import { TelemetryGateway } from './telemetry.gateway.js';

@Global()
@Module({
  providers: [SocketBroadcasterService, ControlGateway, TelemetryGateway],
  exports: [SocketBroadcasterService, ControlGateway, TelemetryGateway],
})
export class SocketModule {}
