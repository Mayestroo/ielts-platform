import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { Role, Tier, SessionStatus } from '@prisma/client';

export interface RegisterDto {
  email: string;
  password: string;
  full_name: string;
  role?: Role;
  tier?: Tier;
}

export interface LoginDto {
  email: string;
  password: string;
  device_fingerprint?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        password_hash: passwordHash,
        full_name: dto.full_name.trim(),
        role: dto.role || Role.STUDENT,
        tier: dto.tier || Tier.FREE,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        tier: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: user.id,
        action: 'USER_REGISTERED',
        entity: 'User',
        entity_id: user.id,
        meta: { email: user.email, role: user.role },
      },
    });

    const token = this.generateToken(user);

    return {
      access_token: token,
      user,
    };
  }

  async login(
    dto: LoginDto,
    meta?: { ip_address?: string; user_agent?: string }
  ) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`Failed login attempt for non-existent email: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      await this.prisma.auditLog.create({
        data: {
          actor_id: user.id,
          action: 'LOGIN_FAILED',
          entity: 'User',
          entity_id: user.id,
          meta: { reason: 'INVALID_PASSWORD', ip: meta?.ip_address },
        },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Single Active Session Concurrency Check (ADR-0014)
    let activeSessionId: string | null = null;
    if (user.role === Role.STUDENT) {
      const activeSession = await this.prisma.examSession.findFirst({
        where: {
          user_id: user.id,
          status: {
            in: [SessionStatus.IN_PROGRESS, SessionStatus.PAUSED_DISCONNECTED],
          },
        },
        orderBy: { started_at: 'desc' },
      });

      if (activeSession) {
        activeSessionId = activeSession.id;
        // Check if an active session device exists and is bound to a different device
        if (dto.device_fingerprint) {
          const activeDevice = await this.prisma.sessionDevice.findFirst({
            where: {
              user_id: user.id,
              revoked_at: null,
            },
            orderBy: { issued_at: 'desc' },
          });

          if (activeDevice && activeDevice.device_fingerprint !== dto.device_fingerprint) {
            // Concurrent device access during ongoing examination rejected per ADR-0014
            await this.prisma.auditLog.create({
              data: {
                actor_id: user.id,
                action: 'CONCURRENT_LOGIN_BLOCKED',
                entity: 'ExamSession',
                entity_id: activeSession.id,
                meta: {
                  attempted_device: dto.device_fingerprint,
                  registered_device: activeDevice.device_fingerprint,
                },
              },
            });
            throw new ConflictException(
              'An active examination session is currently ongoing for this account on another device. Concurrent sessions are prohibited.'
            );
          }
        }
      }
    }

    // Register / Update Session Device
    if (dto.device_fingerprint) {
      await this.prisma.sessionDevice.create({
        data: {
          user_id: user.id,
          device_fingerprint: dto.device_fingerprint,
          ip: meta?.ip_address || '127.0.0.1',
          user_agent: meta?.user_agent || 'unknown',
        },
      });
    }

    const token = this.generateToken(user);

    await this.prisma.auditLog.create({
      data: {
        actor_id: user.id,
        action: 'USER_LOGGED_IN',
        entity: 'User',
        entity_id: user.id,
        meta: { ip: meta?.ip_address, user_agent: meta?.user_agent },
      },
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        tier: user.tier,
      },
      active_session_id: activeSessionId,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        tier: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async logout(userId: string) {
    await this.prisma.sessionDevice.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: userId,
        action: 'USER_LOGGED_OUT',
        entity: 'User',
        entity_id: userId,
      },
    });

    return { success: true };
  }

  private generateToken(user: { id: string; email: string | null; role: string; tier: string }) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email || '',
      role: user.role,
      tier: user.tier,
    });
  }
}
