import { Module } from '@nestjs/common';
import { ExamSessionService } from './exam-session.service.js';
import { ExamSessionController } from './exam-session.controller.js';
import { AdminProctorController } from './admin-proctor.controller.js';
import { SocketModule } from '../socket/socket.module.js';

@Module({
  imports: [SocketModule],
  controllers: [ExamSessionController, AdminProctorController],
  providers: [ExamSessionService],
  exports: [ExamSessionService],
})
export class ExamSessionModule {}
