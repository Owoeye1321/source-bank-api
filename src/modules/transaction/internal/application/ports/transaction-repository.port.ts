import { TransactionEntity } from '../../domain/entities/transaction.entity';
import type { TransactionType } from '../../domain/enums/transaction-type.enum';

export interface ITransactionRepository {
  findByUserId(
    userId: number,
    options: {
      page: number;
      limit: number;
      transactionType?: TransactionType;
    },
  ): Promise<[TransactionEntity[], number]>;
}
