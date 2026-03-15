import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from '../../../src/modules/transaction/internal/application/services/transaction.service';
import { TransactionType } from '../../../src/modules/transaction/internal/domain/enums/transaction-type.enum';

describe('TransactionService', () => {
  let service: TransactionService;

  const mockTransactions = [
    {
      id: 1,
      reference: 'ref-1',
      transactionType: TransactionType.CREDIT,
      amount: 5000,
      previousBalance: 0,
      currentBalance: 5000,
      description: 'Deposit from external source',
      senderDebitTransRef: null,
      receiverCreditTransRef: null,
      userId: 1,
      createdAt: new Date('2026-03-14T10:00:00Z'),
    },
    {
      id: 2,
      reference: 'ref-2',
      transactionType: TransactionType.DEBIT,
      amount: 1500,
      previousBalance: 5000,
      currentBalance: 3500,
      description: 'Transfer to user@example.com',
      senderDebitTransRef: 'ref-2',
      receiverCreditTransRef: 'ref-3',
      userId: 1,
      createdAt: new Date('2026-03-14T11:00:00Z'),
    },
  ];

  const mockTransactionRepository = {
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: 'ITransactionRepository',
          useValue: mockTransactionRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    jest.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should return paginated transactions for user', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue([
        mockTransactions,
        2,
      ]);

      const result = await service.getTransactions(1, { page: 1, limit: 20 });

      expect(result.transactions).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
      expect(result.transactions[0].amount).toBe(5000);
    });

    it('should filter by transactionType when provided', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue([
        [mockTransactions[0]],
        1,
      ]);

      const result = await service.getTransactions(1, {
        page: 1,
        limit: 20,
        transactionType: TransactionType.CREDIT,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].transactionType).toBe(
        TransactionType.CREDIT,
      );
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 20,
        transactionType: TransactionType.CREDIT,
      });
    });

    it('should return correct pagination meta', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue([
        mockTransactions,
        45,
      ]);

      const result = await service.getTransactions(1, { page: 2, limit: 20 });

      expect(result.meta).toEqual({
        page: 2,
        limit: 20,
        total: 45,
        totalPages: 3,
      });
    });
  });
});
