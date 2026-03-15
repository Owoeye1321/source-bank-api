import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { RegisterDto } from '../../domain/dtos/register.dto';
import { LoginDto } from '../../domain/dtos/login.dto';
import type { ApiResponse } from '../../../../../common/types/api-response.interface';
import type { AuthResponse } from '../../domain/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<ApiResponse<AuthResponse>> {
    const data = await this.authService.register(dto);
    return {
      success: true,
      message: 'Registration successful',
      data,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<ApiResponse<AuthResponse>> {
    const data = await this.authService.login(dto);
    return {
      success: true,
      message: 'Login successful',
      data,
    };
  }
}
