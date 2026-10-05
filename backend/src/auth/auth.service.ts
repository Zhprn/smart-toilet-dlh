import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { Optional, UnauthorizedException } from '@nestjs/common';
import { LoginRateLimitService } from './login-rate-limit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    @Optional() private readonly loginRateLimit?: LoginRateLimitService,
  ) {}
  async login(loginDto: LoginDto, ip = 'unknown') {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: loginDto.email,
        deletedAt: null,
      },
    });
    if (!user) {
      await this.loginRateLimit?.recordFailure(ip, loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordMatch) {
      await this.loginRateLimit?.recordFailure(ip, loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    };
  }
  async logout(userId: string, token: string) {
    await this.prismaService.tokenBlacklist.create({
      data: {
        token,
        userId,
        createdAt: new Date(),
      },
    });
    return {
      message: 'Logout successfully',
    };
  }
}
