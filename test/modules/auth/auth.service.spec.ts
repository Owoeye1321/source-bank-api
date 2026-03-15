/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../src/modules/auth/internal/application/services/auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockAuthRepository = {
    findByEmail: jest.fn(),
    findByAccountNumber: jest.fn(),
    findById: jest.fn(),
    createUserWithWallet: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'IAuthRepository', useValue: mockAuthRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = { email: 'Test@Example.com', password: 'password123' };

    it('should create a user with hashed password and wallet, and return JWT', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockAuthRepository.createUserWithWallet.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        accountNumber: '1234567890',
      });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result).toHaveProperty('accountNumber', '1234567890');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockAuthRepository.createUserWithWallet).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed-password',
        accountNumber: expect.any(String),
      });
    });

    it('should normalize email to lowercase', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockAuthRepository.createUserWithWallet.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        accountNumber: '1234567890',
      });

      await service.register(registerDto);

      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should generate a 10-digit account number', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockAuthRepository.createUserWithWallet.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        accountNumber: '1234567890',
      });

      await service.register(registerDto);

      const callArgs = mockAuthRepository.createUserWithWallet.mock.calls[0][0];
      expect(callArgs.accountNumber).toHaveLength(10);
      expect(Number(callArgs.accountNumber)).toBeGreaterThanOrEqual(1000000000);
      expect(Number(callArgs.accountNumber)).toBeLessThanOrEqual(9999999999);
    });

    it('should reject duplicate email', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'Test@Example.com', password: 'password123' };

    it('should return JWT for valid credentials', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        accountNumber: '1234567890',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should normalize email to lowercase on login', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
