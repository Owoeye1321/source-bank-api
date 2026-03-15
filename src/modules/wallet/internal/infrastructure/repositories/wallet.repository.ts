import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { TransactionEntity } from '../../../../transaction/internal/domain/entities/transaction.entity';
import { TransactionType } from '../../../../transaction/internal/domain/enums/transaction-type.enum';
import type { IWalletRepository } from '../../application/ports/wallet-repository.port';
import type { DepositResult, TransferResult } from '../../domain/types';

@Injectable()
export class WalletRepository implements IWalletRepository {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findByUserId(userId: number): Promise<WalletEntity | null> {
    return this.walletRepo.findOne({ where: { userId } });
  }

  async deposit(userId: number, amount: number): Promise<DepositResult> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(WalletEntity, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const previousBalance = Number(wallet.accountBalance);
      const currentBalance = previousBalance + amount;

      await manager.update(
        WalletEntity,
        { id: wallet.id },
        { accountBalance: currentBalance },
      );

      const reference = uuidv4();
      const transaction = manager.create(TransactionEntity, {
        reference,
        transactionType: TransactionType.CREDIT,
        amount,
        previousBalance,
        currentBalance,
        description: 'Deposit from external source',
        userId,
      });
      await manager.save(TransactionEntity, transaction);

      return { reference, amount, previousBalance, currentBalance };
    });
  }

  async transfer(
    senderId: number,
    recipientId: number,
    amount: number,
    senderDescription: string,
    recipientDescription: string,
  ): Promise<TransferResult> {
    return this.dataSource.transaction(async (manager) => {
      // Lock wallets in consistent order (lower userId first) to prevent deadlocks
      const [firstId, secondId] =
        senderId < recipientId
          ? [senderId, recipientId]
          : [recipientId, senderId];

      const wallets = await manager
        .createQueryBuilder(WalletEntity, 'wallet')
        .where('wallet.userId IN (:...userIds)', {
          userIds: [firstId, secondId],
        })
        .setLock('pessimistic_write')
        .getMany();

      const senderWallet = wallets.find((w) => w.userId === senderId);
      const recipientWallet = wallets.find((w) => w.userId === recipientId);

      if (!senderWallet || !recipientWallet) {
        throw new NotFoundException('Wallet not found');
      }

      const senderPreviousBalance = Number(senderWallet.accountBalance);
      if (senderPreviousBalance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const recipientPreviousBalance = Number(recipientWallet.accountBalance);

      const senderCurrentBalance = senderPreviousBalance - amount;
      const recipientCurrentBalance = recipientPreviousBalance + amount;

      await manager.update(
        WalletEntity,
        { id: senderWallet.id },
        { accountBalance: senderCurrentBalance },
      );
      await manager.update(
        WalletEntity,
        { id: recipientWallet.id },
        { accountBalance: recipientCurrentBalance },
      );

      const debitRef = uuidv4();
      const creditRef = uuidv4();

      const debitTx = manager.create(TransactionEntity, {
        reference: debitRef,
        transactionType: TransactionType.DEBIT,
        amount,
        previousBalance: senderPreviousBalance,
        currentBalance: senderCurrentBalance,
        description: senderDescription,
        userId: senderId,
        senderDebitTransRef: debitRef,
        receiverCreditTransRef: creditRef,
      });

      const creditTx = manager.create(TransactionEntity, {
        reference: creditRef,
        transactionType: TransactionType.CREDIT,
        amount,
        previousBalance: recipientPreviousBalance,
        currentBalance: recipientCurrentBalance,
        description: recipientDescription,
        userId: recipientId,
        senderDebitTransRef: debitRef,
        receiverCreditTransRef: creditRef,
      });

      await manager.save(TransactionEntity, [debitTx, creditTx]);

      return {
        debitRef,
        creditRef,
        amount,
        senderPreviousBalance,
        senderCurrentBalance,
      };
    });
  }
}
