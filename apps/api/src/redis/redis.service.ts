import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  onModuleInit() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 200, 2000);
      },
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  async setTimer(sessionId: string, seconds: number): Promise<void> {
    await this.client.set(`exam:timer:${sessionId}`, seconds.toString());
  }

  async getTimer(sessionId: string): Promise<number | null> {
    const val = await this.client.get(`exam:timer:${sessionId}`);
    return val ? parseInt(val, 10) : null;
  }

  async decrementTimer(sessionId: string, delta: number = 1): Promise<number> {
    const key = `exam:timer:${sessionId}`;
    const res = await this.client.decrby(key, delta);
    return Math.max(0, res);
  }

  async addTimerSeconds(sessionId: string, seconds: number): Promise<number> {
    const key = `exam:timer:${sessionId}`;
    const res = await this.client.incrby(key, seconds);
    return res;
  }

  async recordHeartbeat(sessionId: string): Promise<void> {
    await this.client.set(`exam:heartbeat:${sessionId}`, Date.now().toString());
  }

  async getLastHeartbeat(sessionId: string): Promise<number | null> {
    const val = await this.client.get(`exam:heartbeat:${sessionId}`);
    return val ? parseInt(val, 10) : null;
  }
}
