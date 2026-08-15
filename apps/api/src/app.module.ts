import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { SocketModule } from './socket/socket.module.js';
import { ProctoringModule } from './proctoring/proctoring.module.js';
import { ExamSessionModule } from './exam-session/exam-session.module.js';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    RedisModule,
    SocketModule,
    ProctoringModule,
    ExamSessionModule,
  ],
})
export class AppModule {}
