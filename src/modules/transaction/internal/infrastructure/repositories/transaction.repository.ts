import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import type { ITransactionRepository } from '../../application/ports/transaction-repository.port';
import type { TransactionType } from '../../domain/enums/transaction-type.enum';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
  ) {}

  async findByUserId(
    userId: number,
    options: {
      page: number;
      limit: number;
      transactionType?: TransactionType;
    },
  ): Promise<[TransactionEntity[], number]> {
    const where: Record<string, unknown> = { userId };

    if (options.transactionType) {
      where.transactionType = options.transactionType;
    }

    return this.transactionRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });
  }
}
