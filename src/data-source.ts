import 'dotenv/config';
import { DataSource } from 'typeorm';
import { UserEntity } from './modules/auth/internal/domain/entities/user.entity';
import { WalletEntity } from './modules/wallet/internal/domain/entities/wallet.entity';
import { TransactionEntity } from './modules/transaction/internal/domain/entities/transaction.entity';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [UserEntity, WalletEntity, TransactionEntity],
  migrations: ['dist/migrations/*.js'],
});
