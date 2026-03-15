import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from './internal/domain/entities/user.entity';
import { AuthService } from './internal/application/services/auth.service';
import { AuthRepository } from './internal/infrastructure/repositories/auth.repository';
import { JwtStrategy } from './internal/infrastructure/strategies/jwt.strategy';
import { AuthController } from './internal/infrastructure/controllers/auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET')!,
        signOptions: {
          expiresIn: config.get<number>('JWT_EXPIRATION_SECONDS', 86400),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'IAuthRepository',
      useClass: AuthRepository,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, 'IAuthRepository'],
})
export class AuthModule {}
