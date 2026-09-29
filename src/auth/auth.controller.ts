import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { LoginDto, LoginSchema } from './dto/login.dto';
import { ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { ResponseLoginDto } from './dto/response-login.dto';
import { User } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from './guard/jwt-guard.auth';
import { LoginRateLimitGuard } from './login-rate-limit.guard';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LoginRateLimitGuard)
  @Post('login')
  @ApiBody({
    description: 'Login User',
    schema: {
      example: {
        email: 'admin@gate-qris.com',
        password: 'StrongPassword123!',
      },
    },
  })
  @ApiOkResponse({
    description: 'Login User successfully',
    type: ResponseLoginDto,
  })
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) loginDto: LoginDto,
    @Req() request: Request,
  ) {
    return this.authService.login(loginDto, request.ip || 'unknown');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Logout User successfully',
  })
  @Post('logout')
  async logout(@User() user, @Req() request: Request) {
    const authHeader = request.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    return this.authService.logout(user.id, token);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('validate-token')
  @ApiOkResponse({
    description: 'Validate token successfully',
    type: ResponseLoginDto,
  })
  async validateToken(@User() user) {
    return {
      valid: true,
      user,
    };
  }
}
