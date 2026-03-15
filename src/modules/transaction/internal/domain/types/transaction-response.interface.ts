import type { TransactionEntity } from '../entities/transaction.entity';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionListResponse {
  transactions: TransactionEntity[];
  meta: PaginationMeta;
}
