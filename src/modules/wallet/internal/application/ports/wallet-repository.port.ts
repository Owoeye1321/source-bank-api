import type { WalletEntity } from '../../domain/entities/wallet.entity';
import type { DepositResult, TransferResult } from '../../domain/types';

export interface IWalletRepository {
  findByUserId(userId: number): Promise<WalletEntity | null>;
  deposit(userId: number, amount: number): Promise<DepositResult>;
  transfer(
    senderId: number,
    recipientId: number,
    amount: number,
    senderDescription: string,
    recipientDescription: string,
  ): Promise<TransferResult>;
}
