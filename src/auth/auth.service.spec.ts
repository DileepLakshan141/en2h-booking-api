import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mocked.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'jane@example.com',
      password: 'StrongPass123',
    };

    it('throws a Conflict error if the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password before saving the user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: registerDto.email,
        password: 'hashed-password',
        createdAt: new Date(),
      });

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: registerDto.email, password: 'hashed-password' },
      });
    });

    it('returns the created user without a password or access token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: registerDto.email,
        password: 'hashed-password',
        createdAt: new Date(),
      });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('id', 'user-1');
      expect(result).toHaveProperty('email', registerDto.email);
      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'jane@example.com',
      password: 'StrongPass123',
    };

    it('throws Unauthorized if the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('throws Unauthorized if the password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('returns an access token on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token', 'mocked.jwt.token');
      expect(result.user).toMatchObject({
        id: 'user-1',
        email: loginDto.email,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: loginDto.email,
      });
    });
  });
});
