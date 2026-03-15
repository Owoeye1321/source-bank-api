import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { WalletService } from '../../application/services/wallet.service';
import { DepositDto } from '../../domain/dtos/deposit.dto';
import { TransferDto } from '../../domain/dtos/transfer.dto';
import { JwtAuthGuard } from '../../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../auth/internal/domain/types';
import type { ApiResponse } from '../../../../../common/types/api-response.interface';
import type {
  WalletResponse,
  DepositResponse,
  TransferResponse,
} from '../../domain/types';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponse<WalletResponse>> {
    const data = await this.walletService.getWallet(user.id);
    return {
      success: true,
      message: 'Wallet retrieved',
      data,
    };
  }

  @Post('deposit')
  async deposit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DepositDto,
  ): Promise<ApiResponse<DepositResponse>> {
    const data = await this.walletService.deposit(user.id, dto);
    return {
      success: true,
      message: 'Deposit successful',
      data,
    };
  }

  @Post('transfer')
  async transfer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TransferDto,
  ): Promise<ApiResponse<TransferResponse>> {
    const data = await this.walletService.transfer(user.id, dto);
    return {
      success: true,
      message: 'Transfer successful',
      data,
    };
  }
}
