import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletEntity } from './internal/domain/entities/wallet.entity';
import { WalletService } from './internal/application/services/wallet.service';
import { WalletRepository } from './internal/infrastructure/repositories/wallet.repository';
import { WalletController } from './internal/infrastructure/controllers/wallet.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([WalletEntity]), AuthModule],
  providers: [
    WalletService,
    {
      provide: 'IWalletRepository',
      useClass: WalletRepository,
    },
  ],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
