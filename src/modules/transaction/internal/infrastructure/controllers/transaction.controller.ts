import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TransactionService } from '../../application/services/transaction.service';
import { TransactionQueryDto } from '../../domain/dtos/transaction-query.dto';
import { JwtAuthGuard } from '../../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../auth/internal/domain/types';
import type { ApiResponse } from '../../../../../common/types/api-response.interface';
import type { TransactionListResponse } from '../../domain/types';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async getTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TransactionQueryDto,
  ): Promise<ApiResponse<TransactionListResponse>> {
    const data = await this.transactionService.getTransactions(user.id, query);
    return {
      success: true,
      message: 'Transactions retrieved',
      data,
    };
  }
}
