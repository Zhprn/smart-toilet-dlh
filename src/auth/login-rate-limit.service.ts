import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

const WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class LoginRateLimitService implements OnModuleInit, OnModuleDestroy {
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.cleanupTimer = setInterval(
      () => {
        void this.prisma.$executeRawUnsafe(
          `DELETE FROM "LoginAttemptBucket" WHERE "windowStartedAt" < NOW() - INTERVAL '1 day'`,
        );
      },
      60 * 60 * 1000,
    );
    this.cleanupTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  async check(ip: string, email?: string): Promise<number> {
    let retryAfterSeconds = 0;
    for (const key of this.keys(ip, email)) {
      const rows = await this.prisma.$queryRawUnsafe<
        { count: number; windowStartedAt: Date }[]
      >(
        `SELECT "count", "windowStartedAt" FROM "LoginAttemptBucket" WHERE "key" = $1`,
        key,
      );
      const bucket = rows[0];
      if (bucket && bucket.count >= MAX_FAILED_ATTEMPTS) {
        const windowEndsAt =
          new Date(bucket.windowStartedAt).getTime() + WINDOW_MS;
        retryAfterSeconds = Math.max(
          retryAfterSeconds,
          Math.ceil((windowEndsAt - Date.now()) / 1000),
        );
      }
    }
    return retryAfterSeconds;
  }

  async recordFailure(ip: string, email?: string) {
    for (const key of this.keys(ip, email)) {
      await this.prisma.$queryRawUnsafe(
        `INSERT INTO "LoginAttemptBucket" ("key", "count", "windowStartedAt")
         VALUES ($1, 1, NOW())
         ON CONFLICT ("key") DO UPDATE SET
           "count" = CASE
             WHEN "LoginAttemptBucket"."windowStartedAt" <= NOW() - INTERVAL '5 minutes' THEN 1
             ELSE "LoginAttemptBucket"."count" + 1
           END,
           "windowStartedAt" = CASE
             WHEN "LoginAttemptBucket"."windowStartedAt" <= NOW() - INTERVAL '5 minutes' THEN NOW()
             ELSE "LoginAttemptBucket"."windowStartedAt"
           END
         RETURNING "count"`,
        key,
      );
    }
  }

  private keys(ip: string, email?: string) {
    const values = [`ip:${ip}`];
    if (email) values.push(`email:${email.trim().toLowerCase()}`);
    return values.map((value) => this.hash(value));
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
