import type { UserEntity } from '../../domain/entities/user.entity';
import type { CreateUserWithWalletData } from '../../domain/types';

export interface IAuthRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByAccountNumber(accountNumber: string): Promise<UserEntity | null>;
  findById(id: number): Promise<UserEntity | null>;
  createUserWithWallet(data: CreateUserWithWalletData): Promise<UserEntity>;
}
