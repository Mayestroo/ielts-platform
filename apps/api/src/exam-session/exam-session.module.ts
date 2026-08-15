import { Module } from '@nestjs/common';
import { ExamSessionService } from './exam-session.service.js';
import { ExamSessionController } from './exam-session.controller.js';

@Module({
  controllers: [ExamSessionController],
  providers: [ExamSessionService],
  exports: [ExamSessionService],
})
export class ExamSessionModule {}
