import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../../domain/entities/user.entity';
import { WalletEntity } from '../../../../wallet/internal/domain/entities/wallet.entity';
import type { IAuthRepository } from '../../application/ports/auth-repository.port';
import type { CreateUserWithWalletData } from '../../domain/types';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByAccountNumber(accountNumber: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { accountNumber } });
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async createUserWithWallet(
    data: CreateUserWithWalletData,
  ): Promise<UserEntity> {
    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(UserEntity, data);
      const savedUser = await manager.save(UserEntity, user);

      const wallet = manager.create(WalletEntity, {
        userId: savedUser.id,
        accountBalance: 0,
      });
      await manager.save(WalletEntity, wallet);

      return savedUser;
    });
  }
}
