import { Module } from '@nestjs/common';
import { ControlGateway } from './control.gateway.js';

@Module({
  providers: [ControlGateway],
  exports: [ControlGateway],
})
export class SocketModule {}
