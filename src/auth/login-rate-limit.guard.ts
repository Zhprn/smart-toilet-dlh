import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoginRateLimitService } from './login-rate-limit.service';

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimit: LoginRateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const email =
      typeof request.body?.email === 'string' ? request.body.email : undefined;
    const retryAfter = await this.rateLimit.check(ip, email);

    if (retryAfter > 0) {
      response.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        'Too many login attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
