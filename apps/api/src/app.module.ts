import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { SocketModule } from './socket/socket.module.js';
import { ExamSessionModule } from './exam-session/exam-session.module.js';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    SocketModule,
    ExamSessionModule,
  ],
})
export class AppModule {}
