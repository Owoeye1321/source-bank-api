import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './internal/domain/entities/transaction.entity';
import { TransactionService } from './internal/application/services/transaction.service';
import { TransactionRepository } from './internal/infrastructure/repositories/transaction.repository';
import { TransactionController } from './internal/infrastructure/controllers/transaction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity])],
  providers: [
    TransactionService,
    {
      provide: 'ITransactionRepository',
      useClass: TransactionRepository,
    },
  ],
  controllers: [TransactionController],
  exports: [TransactionService],
})
export class TransactionModule {}
