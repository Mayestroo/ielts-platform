import { Global, Module } from '@nestjs/common';
import { ProctoringAuthorityService } from './proctoring-authority.service.js';
import { SocketModule } from '../socket/socket.module.js';

@Global()
@Module({
  imports: [SocketModule],
  providers: [ProctoringAuthorityService],
  exports: [ProctoringAuthorityService],
})
export class ProctoringModule {}
