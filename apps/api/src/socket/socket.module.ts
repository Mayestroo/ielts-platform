import { Module } from '@nestjs/common';
import { ControlGateway } from './control.gateway.js';
import { TelemetryGateway } from './telemetry.gateway.js';

@Module({
  providers: [ControlGateway, TelemetryGateway],
  exports: [ControlGateway, TelemetryGateway],
})
export class SocketModule {}
