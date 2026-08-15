import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/auth/auth.service.js';
import { RolesGuard } from '../src/auth/roles.guard.js';
import { Role, SessionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('AuthService & RBAC Security Layer', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      examSession: {
        findFirst: vi.fn(),
      },
      sessionDevice: {
        findFirst: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };

    mockJwtService = {
      sign: vi.fn().mockReturnValue('mock-jwt-token-123'),
    };

    authService = new AuthService(mockPrisma, mockJwtService);
  });

  it('authenticates user with valid password and generates JWT token', async () => {
    const passwordHash = await bcrypt.hash('Secret123!', 10);
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'u-1',
      email: 'student@ielts.local',
      password_hash: passwordHash,
      full_name: 'Jasurbek R.',
      role: Role.STUDENT,
      tier: 'PREMIUM',
    });

    const result = await authService.login({
      email: 'student@ielts.local',
      password: 'Secret123!',
    });

    expect(result.access_token).toBe('mock-jwt-token-123');
    expect(result.user.email).toBe('student@ielts.local');
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'USER_LOGGED_IN',
        entity_id: 'u-1',
      }),
    });
  });

  it('rejects invalid password and writes failure to AuditLog', async () => {
    const passwordHash = await bcrypt.hash('Secret123!', 10);
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'u-1',
      email: 'student@ielts.local',
      password_hash: passwordHash,
      full_name: 'Jasurbek R.',
      role: Role.STUDENT,
    });

    await expect(
      authService.login({
        email: 'student@ielts.local',
        password: 'WrongPassword!',
      })
    ).rejects.toThrow('Invalid email or password');

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'LOGIN_FAILED',
      }),
    });
  });

  it('blocks concurrent multi-device logins during ongoing exam sessions (ADR-0014)', async () => {
    const passwordHash = await bcrypt.hash('Secret123!', 10);
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'u-1',
      email: 'student@ielts.local',
      password_hash: passwordHash,
      full_name: 'Jasurbek R.',
      role: Role.STUDENT,
    });

    // Active ongoing exam session found
    mockPrisma.examSession.findFirst.mockResolvedValueOnce({
      id: 'active-exam-sess-1',
      status: SessionStatus.IN_PROGRESS,
    });

    // Existing registered device is different from attempted device
    mockPrisma.sessionDevice.findFirst.mockResolvedValueOnce({
      device_fingerprint: 'device-desktop-chrome-1',
      is_active: true,
    });

    await expect(
      authService.login({
        email: 'student@ielts.local',
        password: 'Secret123!',
        device_fingerprint: 'device-mobile-safari-2',
      })
    ).rejects.toThrow('An active examination session is currently ongoing');

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CONCURRENT_LOGIN_BLOCKED',
        entity_id: 'active-exam-sess-1',
      }),
    });
  });

  describe('RolesGuard', () => {
    it('authorizes user when role matches requirement', () => {
      const mockReflector: any = {
        getAllAndOverride: vi.fn().mockReturnValue([Role.ADMIN]),
      };
      const guard = new RolesGuard(mockReflector);

      const mockContext: any = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            user: { id: 'admin-1', role: Role.ADMIN },
          }),
        }),
      };

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('rejects access with ForbiddenException when role does not match', () => {
      const mockReflector: any = {
        getAllAndOverride: vi.fn().mockReturnValue([Role.ADMIN]),
      };
      const guard = new RolesGuard(mockReflector);

      const mockContext: any = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            user: { id: 'student-1', role: Role.STUDENT },
          }),
        }),
      };

      expect(() => guard.canActivate(mockContext)).toThrow(
        'You do not have permission to access this resource'
      );
    });
  });
});
