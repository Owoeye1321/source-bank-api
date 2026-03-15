import { Injectable, Inject } from '@nestjs/common';
import type { ITransactionRepository } from '../ports/transaction-repository.port';
import { TransactionQueryDto } from '../../domain/dtos/transaction-query.dto';
import type { TransactionListResponse } from '../../domain/types';

@Injectable()
export class TransactionService {
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async getTransactions(
    userId: number,
    query: TransactionQueryDto,
  ): Promise<TransactionListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [transactions, total] = await this.transactionRepository.findByUserId(
      userId,
      { page, limit, transactionType: query.transactionType },
    );

    return {
      transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
