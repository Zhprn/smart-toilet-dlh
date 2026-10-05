import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('test-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should include role in jwt payload and returned response', async () => {
    const passwordHash = await bcrypt.hash('StrongPassword123!', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'superadmin@gate-qris.com',
      password: passwordHash,
      name: 'Super Admin',
      role: 'SUPERADMIN',
    });

    const result = await service.login({
      email: 'superadmin@gate-qris.com',
      password: 'StrongPassword123!',
    });

    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-1',
        email: 'superadmin@gate-qris.com',
        role: 'SUPERADMIN',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'superadmin@gate-qris.com',
        role: 'SUPERADMIN',
        token: 'test-token',
      }),
    );
  });
});
