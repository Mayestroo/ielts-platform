import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../redis/redis.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SocketBroadcasterService } from '../socket/socket-broadcaster.service.js';
import { SessionStatus } from '@prisma/client';

export interface ProctorInfractionResult {
  infractionCount: number;
  isEscalated: boolean;
  reason: string;
}

export interface ProctorTimeExtensionResult {
  newTimeRemaining: number;
  addedSeconds: number;
}

@Injectable()
export class ProctoringAuthorityService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProctoringAuthorityService.name);
  private debounceMap = new Map<string, number>(); // sessionId -> timestamp of last infraction
  private disconnectFlagMap = new Set<string>(); // sessionIds flagged for current disconnect period
  private sweepInterval?: NodeJS.Timeout;

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly broadcaster: SocketBroadcasterService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.logger.log('ProctoringAuthority deep module initialized');
    // Start passive disconnect monitoring sweep (runs every 5 seconds)
    this.sweepInterval = setInterval(() => {
      this.sweepActiveCandidates().catch((err) => {
        this.logger.error('Error during proctoring sweep', err);
      });
    }, 5000);
  }

  onModuleDestroy() {
    if (this.sweepInterval) clearInterval(this.sweepInterval);
  }

  /**
   * 1. Record candidate heartbeat with network presence tracking.
   */
  async recordHeartbeat(sessionId: string): Promise<void> {
    const now = Date.now();
    const redisClient = this.redis.getClient();
    const ttlSeconds = 7200; // 2 hours default TTL

    await redisClient.set(`exam:heartbeat:${sessionId}`, now.toString(), 'EX', ttlSeconds);
    this.disconnectFlagMap.delete(sessionId); // Clear disconnect flag on fresh heartbeat
    this.broadcaster.emitCandidateHeartbeat(sessionId, now);
  }

  /**
   * 2. Atomic Redis infraction persistence with 500ms debounce protection and 3+ audit escalation.
   */
  async recordInfraction(sessionId: string, reason: string): Promise<ProctorInfractionResult> {
    const now = Date.now();
    const lastInfractionTime = this.debounceMap.get(sessionId) || 0;

    // 500ms Debounce gate: prevent duplicate rapid browser event firings
    if (now - lastInfractionTime < 500) {
      const currentCount = await this.getInfractionCount(sessionId);
      return {
        infractionCount: currentCount,
        isEscalated: currentCount >= 3,
        reason,
      };
    }
    this.debounceMap.set(sessionId, now);

    const redisClient = this.redis.getClient();
    const ttlSeconds = 7200; // max session duration + 30m buffer

    const countKey = `exam:infraction_count:${sessionId}`;
    const logKey = `exam:infractions_log:${sessionId}`;

    // Atomic MULTI/EXEC Redis transaction (Q1)
    const pipeline = redisClient.multi();
    pipeline.incr(countKey);
    pipeline.rpush(logKey, JSON.stringify({ reason, timestamp: now }));
    pipeline.expire(countKey, ttlSeconds);
    pipeline.expire(logKey, ttlSeconds);

    const results = await pipeline.exec();
    const newCount = (results?.[0]?.[1] as number) || 1;

    // Fetch candidate metadata
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { user: { select: { id: true, full_name: true } } },
    });

    const candidateName = session?.user?.full_name || 'Student';
    const isEscalated = newCount >= 3;

    // Emit live proctor stream update
    this.broadcaster.emitCandidateInfraction(sessionId, candidateName, newCount, reason, now);

    // Escalation gate: 3+ infractions emit high-priority alert and write to AuditLog (ADR-0003)
    if (isEscalated) {
      this.broadcaster.emitProctorAlert(sessionId, candidateName, newCount, 'EXCESSIVE_FOCUS_LOSS', now);

      await this.prisma.auditLog.create({
        data: {
          actor_id: session?.user_id,
          action: 'PROCTOR_INFRACTION_ALERT',
          entity: 'ExamSession',
          entity_id: sessionId,
          meta: {
            infraction_count: newCount,
            reason,
            timestamp: now,
          },
        },
      });
    }

    return {
      infractionCount: newCount,
      isEscalated,
      reason,
    };
  }

  /**
   * 3. Fetch consolidated real-time candidate proctoring state.
   */
  async getLiveCandidates() {
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
        const timeRemaining = await this.getTimeRemaining(sess.id, sess.total_duration_seconds);
        const lastHeartbeat = await this.getLastHeartbeat(sess.id);
        const infractionCount = await this.getInfractionCount(sess.id);

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

  /**
   * 4. Absolute wall-clock time extension with AuditLog and Control Channel broadcast.
   */
  async extendTime(
    sessionId: string,
    seconds: number,
    adminId?: string
  ): Promise<ProctorTimeExtensionResult> {
    const redisClient = this.redis.getClient();
    const expiresKey = `exam:expires_at:${sessionId}`;
    const ttlSeconds = 7200;

    let expiresAt = parseInt((await redisClient.get(expiresKey)) || '0', 10);
    if (!expiresAt || expiresAt < Date.now()) {
      expiresAt = Date.now();
    }

    expiresAt += seconds * 1000;
    await redisClient.set(expiresKey, expiresAt.toString(), 'EX', ttlSeconds);

    const newTimeRemaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));

    // Emit live update to candidate over Control Channel
    this.broadcaster.emitTimeAdded(sessionId, seconds, newTimeRemaining);

    // Record immutable admin audit log
    await this.prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'ADMIN_ADDED_TIME',
        entity: 'ExamSession',
        entity_id: sessionId,
        meta: { added_seconds: seconds, new_expires_at: expiresAt, new_time: newTimeRemaining },
      },
    });

    return {
      newTimeRemaining,
      addedSeconds: seconds,
    };
  }

  /**
   * 5. Decoupled supervisor force-termination emitting internal domain event.
   */
  async forceSubmit(sessionId: string, reason: string, adminId?: string): Promise<void> {
    // 1. Emit Socket.IO termination directive to candidate
    this.broadcaster.emitForceSubmit(sessionId, reason);

    // 2. Record immutable audit log
    await this.prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: 'ADMIN_FORCE_SUBMITTED',
        entity: 'ExamSession',
        entity_id: sessionId,
        meta: { reason },
      },
    });

    // 3. Emit decoupled domain event for ExamSessionService to finalize DB state (Q2)
    this.eventEmitter.emit('exam.force_submitted', {
      sessionId,
      reason,
      adminId,
    });
  }

  /**
   * Absolute wall-clock expiration calculation with Self Practice pause/resume offset shifting (Q4).
   */
  async getTimeRemaining(sessionId: string, defaultDurationSeconds = 3600): Promise<number> {
    const redisClient = this.redis.getClient();
    const expiresKey = `exam:expires_at:${sessionId}`;
    const pausedKey = `exam:paused_at:${sessionId}`;

    const expiresStr = await redisClient.get(expiresKey);
    if (!expiresStr) {
      // Initialize absolute expiration on first access
      const expiresAt = Date.now() + defaultDurationSeconds * 1000;
      await redisClient.set(expiresKey, expiresAt.toString(), 'EX', 7200);
      return defaultDurationSeconds;
    }

    const expiresAt = parseInt(expiresStr, 10);
    const pausedStr = await redisClient.get(pausedKey);

    if (pausedStr) {
      // Paused state (Self Practice): time remains frozen at pause timestamp
      const pausedAt = parseInt(pausedStr, 10);
      return Math.max(0, Math.ceil((expiresAt - pausedAt) / 1000));
    }

    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  }

  async pauseSessionTimer(sessionId: string): Promise<void> {
    const redisClient = this.redis.getClient();
    await redisClient.set(`exam:paused_at:${sessionId}`, Date.now().toString(), 'EX', 7200);
  }

  async resumeSessionTimer(sessionId: string): Promise<number> {
    const redisClient = this.redis.getClient();
    const pausedKey = `exam:paused_at:${sessionId}`;
    const expiresKey = `exam:expires_at:${sessionId}`;

    const pausedStr = await redisClient.get(pausedKey);
    if (pausedStr) {
      const pausedAt = parseInt(pausedStr, 10);
      const pauseDuration = Date.now() - pausedAt;

      const expiresStr = await redisClient.get(expiresKey);
      if (expiresStr) {
        const newExpires = parseInt(expiresStr, 10) + pauseDuration;
        await redisClient.set(expiresKey, newExpires.toString(), 'EX', 7200);
      }
      await redisClient.del(pausedKey);
    }

    return this.getTimeRemaining(sessionId);
  }

  async getInfractionCount(sessionId: string): Promise<number> {
    const redisClient = this.redis.getClient();
    const val = await redisClient.get(`exam:infraction_count:${sessionId}`);
    return val ? parseInt(val, 10) : 0;
  }

  async getLastHeartbeat(sessionId: string): Promise<number | null> {
    const redisClient = this.redis.getClient();
    const val = await redisClient.get(`exam:heartbeat:${sessionId}`);
    return val ? parseInt(val, 10) : null;
  }

  /**
   * Passive disconnect sweep: detects active sessions with >20s loss of heartbeat.
   */
  private async sweepActiveCandidates() {
    const activeSessions = await this.prisma.examSession.findMany({
      where: { status: SessionStatus.IN_PROGRESS },
      select: { id: true },
    });

    const now = Date.now();
    for (const sess of activeSessions) {
      const lastHb = await this.getLastHeartbeat(sess.id);
      if (lastHb && now - lastHb > 20000) {
        // Disconnect >20s detected
        if (!this.disconnectFlagMap.has(sess.id)) {
          this.disconnectFlagMap.add(sess.id);
          this.logger.warn(`Session ${sess.id} exceeded 20s network tolerance. Recording disconnect infraction.`);
          await this.recordInfraction(sess.id, 'Extended network disconnect (>20s)');
        }
      }
    }
  }
}
