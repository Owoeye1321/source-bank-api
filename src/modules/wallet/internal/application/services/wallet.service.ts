import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { IWalletRepository } from '../ports/wallet-repository.port';
import type { IAuthRepository } from '../../../../auth/internal/application/ports/auth-repository.port';
import { DepositDto } from '../../domain/dtos/deposit.dto';
import { TransferDto } from '../../domain/dtos/transfer.dto';
import { RecipientType } from '../../domain/enums/recipient-type.enum';
import type {
  WalletResponse,
  DepositResponse,
  TransferResponse,
} from '../../domain/types';
import type { UserEntity } from '../../../../auth/internal/domain/entities/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) { }

  async getWallet(userId: number): Promise<WalletResponse> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: wallet.id,
      accountBalance: Number(wallet.accountBalance).toFixed(2),
      accountNumber: user.accountNumber,
    };
  }

  async deposit(userId: number, dto: DepositDto): Promise<DepositResponse> {
    const result = await this.walletRepository.deposit(userId, dto.amount);

    return {
      reference: result.reference,
      amount: result.amount.toFixed(2),
      previousBalance: result.previousBalance.toFixed(2),
      currentBalance: result.currentBalance.toFixed(2),
    };
  }

  async transfer(
    senderId: number,
    dto: TransferDto,
  ): Promise<TransferResponse> {
    const recipient = await this.resolveRecipient(dto);

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    if (recipient.id === senderId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    const senderDescription = `Transfer to ${recipient.email}`;
    const recipientDescription = `Transfer from account ${senderId}`;

    const result = await this.walletRepository.transfer(
      senderId,
      recipient.id,
      dto.amount,
      senderDescription,
      recipientDescription,
    );

    return {
      reference: result.debitRef,
      amount: dto.amount.toFixed(2),
      previousBalance: result.senderPreviousBalance.toFixed(2),
      currentBalance: result.senderCurrentBalance.toFixed(2),
      recipient: {
        accountNumber: recipient.accountNumber,
        email: recipient.email,
      },
    };
  }

  private async resolveRecipient(dto: TransferDto): Promise<UserEntity | null> {
    switch (dto.recipientType) {
      case RecipientType.ACCOUNT_NUMBER:
        return this.authRepository.findByAccountNumber(
          dto.recipientAccountNumber!,
        );
      case RecipientType.EMAIL:
        return this.authRepository.findByEmail(
          dto.recipientEmail!.toLowerCase().trim(),
        );
    }
  }
}
