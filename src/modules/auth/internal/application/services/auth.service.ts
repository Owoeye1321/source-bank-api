import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import type { IAuthRepository } from '../ports/auth-repository.port';
import { RegisterDto } from '../../domain/dtos/register.dto';
import { LoginDto } from '../../domain/dtos/login.dto';
import type { AuthResponse, JwtPayload } from '../../domain/types';
import {
  BCRYPT_SALT_ROUNDS,
  ACCOUNT_NUMBER_MIN,
  ACCOUNT_NUMBER_MAX,
} from '../../domain/constants/auth.constants';
import type { UserEntity } from '../../domain/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.authRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const accountNumber = this.generateAccountNumber();

    const user = await this.authRepository.createUserWithWallet({
      email: normalizedEmail,
      password: hashedPassword,
      accountNumber,
    });

    const token = this.generateToken(user);

    return {
      id: user.id,
      email: user.email,
      accountNumber: user.accountNumber,
      token,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.authRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);

    return {
      id: user.id,
      email: user.email,
      accountNumber: user.accountNumber,
      token,
    };
  }

  private generateAccountNumber(): string {
    return String(randomInt(ACCOUNT_NUMBER_MIN, ACCOUNT_NUMBER_MAX + 1));
  }

  private generateToken(user: UserEntity): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
