import { Controller, Get, Post, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { ControlGateway } from '../socket/control.gateway.js';
import { TelemetryGateway } from '../socket/telemetry.gateway.js';
import { SessionStatus } from '@prisma/client';

@Controller('api/admin')
export class AdminProctorController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly controlGateway: ControlGateway,
    private readonly telemetryGateway: TelemetryGateway,
  ) {}

  @Get('live-sessions')
  async getLiveSessions() {
    const sessions = await this.prisma.examSession.findMany({
      where: {
        status: {
          in: [SessionStatus.IN_PROGRESS, SessionStatus.PAUSED_DISCONNECTED],
        },
      },
      include: {
        user: { select: { id: true, full_name: true, email: true } },
      },
      orderBy: { started_at: 'desc' },
    });

    const candidates = await Promise.all(
      sessions.map(async (sess) => {
        const timeRemaining = (await this.redis.getTimer(sess.id)) ?? sess.server_time_remaining;
        const lastHeartbeat = await this.redis.getLastHeartbeat(sess.id);
        const infractionCount = this.telemetryGateway.getInfractions(sess.id);

        const isOnline = lastHeartbeat ? Date.now() - lastHeartbeat < 15000 : true;

        return {
          session_id: sess.id,
          user_id: sess.user_id,
          candidate_name: sess.user.full_name,
          email: sess.user.email,
          current_module: sess.current_module,
          status: sess.status,
          time_remaining: timeRemaining,
          infraction_count: infractionCount,
          is_online: isOnline,
          last_heartbeat_at: lastHeartbeat || Date.now(),
        };
      })
    );

    return candidates;
  }

  @Post('sessions/:id/add-time')
  @HttpCode(HttpStatus.OK)
  async addTime(
    @Param('id') id: string,
    @Body() body: { added_seconds: number }
  ) {
    const addedSeconds = body.added_seconds || 300;
    const newTime = await this.redis.addTimerSeconds(id, addedSeconds);

    this.controlGateway.server.to(`session_${id}`).emit('session:add_time', {
      added_seconds: addedSeconds,
      new_time_remaining: newTime,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'ADMIN_ADDED_TIME',
        entity: 'ExamSession',
        entity_id: id,
        meta: { added_seconds: addedSeconds, new_time: newTime },
      },
    });

    return { success: true, new_time_remaining: newTime };
  }

  @Post('sessions/:id/force-submit')
  @HttpCode(HttpStatus.OK)
  async forceSubmit(
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    const reason = body.reason || 'Terminated by Exam Supervisor';

    this.controlGateway.server.to(`session_${id}`).emit('session:force_submit', {
      reason,
    });

    await this.prisma.examSession.update({
      where: { id },
      data: {
        status: SessionStatus.FORCE_SUBMITTED,
        submitted_at: new Date(),
        server_time_remaining: 0,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'ADMIN_FORCE_SUBMITTED',
        entity: 'ExamSession',
        entity_id: id,
        meta: { reason },
      },
    });

    return { success: true };
  }
}
