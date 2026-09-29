import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any) {
    const userId = payload.sub || payload.id;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }
    const revoked = await this.prisma.tokenBlacklist.findFirst({
      where: { token, userId },
      select: { id: true },
    });
    if (revoked) {
      throw new UnauthorizedException('Token has been revoked');
    }
    return {
      id: userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }
}
