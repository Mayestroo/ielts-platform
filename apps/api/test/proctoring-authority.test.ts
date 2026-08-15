import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProctoringAuthorityService } from '../src/proctoring/proctoring-authority.service.js';

describe('ProctoringAuthorityService', () => {
  let service: ProctoringAuthorityService;
  let mockRedisClient: any;
  let mockRedisService: any;
  let mockPrismaService: any;
  let mockBroadcaster: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockRedisClient = {
      multi: vi.fn().mockReturnValue({
        incr: vi.fn().mockReturnThis(),
        rpush: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([[null, 1]]),
      }),
      set: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(1),
    };

    mockRedisService = {
      getClient: vi.fn().mockReturnValue(mockRedisClient),
    };

    mockPrismaService = {
      examSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'sess-1',
          user_id: 'user-1',
          user: { full_name: 'Test Student' },
        }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };

    mockBroadcaster = {
      emitCandidateHeartbeat: vi.fn(),
      emitCandidateInfraction: vi.fn(),
      emitProctorAlert: vi.fn(),
      emitTimeAdded: vi.fn(),
      emitForceSubmit: vi.fn(),
    };

    mockEventEmitter = {
      emit: vi.fn(),
    };

    service = new ProctoringAuthorityService(
      mockRedisService,
      mockPrismaService,
      mockBroadcaster,
      mockEventEmitter
    );
  });

  it('records infraction atomically with Redis multi/exec', async () => {
    const result = await service.recordInfraction('sess-1', 'Window lost focus');

    expect(mockRedisClient.multi).toHaveBeenCalled();
    expect(mockBroadcaster.emitCandidateInfraction).toHaveBeenCalledWith(
      'sess-1',
      'Test Student',
      1,
      'Window lost focus',
      expect.any(Number)
    );
    expect(result.infractionCount).toBe(1);
    expect(result.isEscalated).toBe(false);
  });

  it('debounces rapid infractions within 500ms', async () => {
    mockRedisClient.get.mockResolvedValueOnce('1');
    const res1 = await service.recordInfraction('sess-1', 'Focus lost 1');
    expect(res1.infractionCount).toBe(1);

    // Call immediately within 500ms
    mockRedisClient.get.mockResolvedValueOnce('1');
    const res2 = await service.recordInfraction('sess-1', 'Focus lost 2');
    expect(res2.infractionCount).toBe(1);
    // Redis multi was only called once
    expect(mockRedisClient.multi).toHaveBeenCalledTimes(1);
  });

  it('escalates and writes AuditLog on 3+ infractions', async () => {
    mockRedisClient.multi().exec.mockResolvedValueOnce([[null, 3]]);

    const result = await service.recordInfraction('sess-1', 'Focus lost 3');

    expect(result.isEscalated).toBe(true);
    expect(mockBroadcaster.emitProctorAlert).toHaveBeenCalled();
    expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
      data: {
        actor_id: 'user-1',
        action: 'PROCTOR_INFRACTION_ALERT',
        entity: 'ExamSession',
        entity_id: 'sess-1',
        meta: expect.objectContaining({
          infraction_count: 3,
        }),
      },
    });
  });

  it('extends time and shifts wall-clock expires_at', async () => {
    const now = Date.now();
    mockRedisClient.get.mockResolvedValueOnce((now + 60000).toString());

    const result = await service.extendTime('sess-1', 300, 'admin-1');

    expect(mockRedisClient.set).toHaveBeenCalled();
    expect(mockBroadcaster.emitTimeAdded).toHaveBeenCalled();
    expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'ADMIN_ADDED_TIME',
        entity_id: 'sess-1',
      }),
    });
    expect(result.addedSeconds).toBe(300);
  });

  it('emits domain event and Socket.IO on forceSubmit without circular dependency', async () => {
    await service.forceSubmit('sess-1', 'Proctor Cheating Termination', 'admin-1');

    expect(mockBroadcaster.emitForceSubmit).toHaveBeenCalledWith(
      'sess-1',
      'Proctor Cheating Termination'
    );
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('exam.force_submitted', {
      sessionId: 'sess-1',
      reason: 'Proctor Cheating Termination',
      adminId: 'admin-1',
    });
    expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'ADMIN_FORCE_SUBMITTED',
        entity_id: 'sess-1',
      }),
    });
  });

  it('calculates Self Practice pause/resume offset correctly', async () => {
    const now = Date.now();
    const expiresAt = now + 3600 * 1000;
    mockRedisClient.get.mockImplementation(async (key: string) => {
      if (key === 'exam:expires_at:sess-1') return expiresAt.toString();
      if (key === 'exam:paused_at:sess-1') return (now - 120000).toString(); // paused 2 mins ago
      return null;
    });

    await service.resumeSessionTimer('sess-1');

    expect(mockRedisClient.set).toHaveBeenCalledWith(
      'exam:expires_at:sess-1',
      expect.any(String),
      'EX',
      7200
    );
    expect(mockRedisClient.del).toHaveBeenCalledWith('exam:paused_at:sess-1');
  });
});
