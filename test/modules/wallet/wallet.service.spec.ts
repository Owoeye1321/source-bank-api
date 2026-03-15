import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from '../../../src/modules/wallet/internal/application/services/wallet.service';
import { RecipientType } from '../../../src/modules/wallet/internal/domain/enums/recipient-type.enum';

describe('WalletService', () => {
  let service: WalletService;

  const mockWalletRepository = {
    findByUserId: jest.fn(),
    deposit: jest.fn(),
    transfer: jest.fn(),
  };

  const mockAuthRepository = {
    findByEmail: jest.fn(),
    findByAccountNumber: jest.fn(),
    findById: jest.fn(),
    createUserWithWallet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: 'IWalletRepository', useValue: mockWalletRepository },
        { provide: 'IAuthRepository', useValue: mockAuthRepository },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    jest.clearAllMocks();
  });

  describe('getWallet', () => {
    it('should return accountBalance for user', async () => {
      mockWalletRepository.findByUserId.mockResolvedValue({
        id: 1,
        accountBalance: 5000,
        userId: 1,
      });
      mockAuthRepository.findById.mockResolvedValue({
        id: 1,
        accountNumber: '1234567890',
      });

      const result = await service.getWallet(1);

      expect(result.accountBalance).toBe('5000.00');
      expect(result.accountNumber).toBe('1234567890');
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockWalletRepository.findByUserId.mockResolvedValue(null);

      await expect(service.getWallet(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockWalletRepository.findByUserId.mockResolvedValue({
        id: 1,
        accountBalance: 5000,
        userId: 999,
      });
      mockAuthRepository.findById.mockResolvedValue(null);

      await expect(service.getWallet(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deposit', () => {
    it('should credit wallet and return formatted result', async () => {
      mockWalletRepository.deposit.mockResolvedValue({
        reference: 'test-ref-123',
        amount: 500,
        previousBalance: 1000,
        currentBalance: 1500,
      });

      const result = await service.deposit(1, { amount: 500 });

      expect(result.reference).toBe('test-ref-123');
      expect(result.previousBalance).toBe('1000.00');
      expect(result.currentBalance).toBe('1500.00');
      expect(result.amount).toBe('500.00');
      expect(mockWalletRepository.deposit).toHaveBeenCalledWith(1, 500);
    });
  });

  describe('transfer', () => {
    it('should transfer by account number and return formatted result', async () => {
      mockAuthRepository.findByAccountNumber.mockResolvedValue({
        id: 2,
        email: 'recipient@example.com',
        accountNumber: '9876543210',
      });
      mockWalletRepository.transfer.mockResolvedValue({
        debitRef: 'debit-ref-123',
        creditRef: 'credit-ref-456',
        amount: 1500,
        senderPreviousBalance: 5000,
        senderCurrentBalance: 3500,
      });

      const result = await service.transfer(1, {
        recipientType: RecipientType.ACCOUNT_NUMBER,
        recipientAccountNumber: '9876543210',
        amount: 1500,
      });

      expect(result.reference).toBe('debit-ref-123');
      expect(result.previousBalance).toBe('5000.00');
      expect(result.currentBalance).toBe('3500.00');
      expect(result.amount).toBe('1500.00');
      expect(result.recipient.email).toBe('recipient@example.com');
      expect(result.recipient.accountNumber).toBe('9876543210');
      expect(mockWalletRepository.transfer).toHaveBeenCalledWith(
        1,
        2,
        1500,
        'Transfer to recipient@example.com',
        'Transfer from account 1',
      );
    });

    it('should transfer by email', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({
        id: 3,
        email: 'user@example.com',
        accountNumber: '1111111111',
      });
      mockWalletRepository.transfer.mockResolvedValue({
        debitRef: 'debit-ref',
        creditRef: 'credit-ref',
        amount: 200,
        senderPreviousBalance: 1000,
        senderCurrentBalance: 800,
      });

      const result = await service.transfer(1, {
        recipientType: RecipientType.EMAIL,
        recipientEmail: ' User@Example.com ',
        amount: 200,
      });

      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith(
        'user@example.com',
      );
      expect(result.recipient.email).toBe('user@example.com');
    });

    it('should reject insufficient balance', async () => {
      mockAuthRepository.findByAccountNumber.mockResolvedValue({
        id: 2,
        email: 'recipient@example.com',
        accountNumber: '9876543210',
      });
      mockWalletRepository.transfer.mockRejectedValue(
        new BadRequestException('Insufficient balance'),
      );

      await expect(
        service.transfer(1, {
          recipientType: RecipientType.ACCOUNT_NUMBER,
          recipientAccountNumber: '9876543210',
          amount: 500,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject self-transfer', async () => {
      mockAuthRepository.findByAccountNumber.mockResolvedValue({
        id: 1,
        email: 'self@example.com',
        accountNumber: '1234567890',
      });

      await expect(
        service.transfer(1, {
          recipientType: RecipientType.ACCOUNT_NUMBER,
          recipientAccountNumber: '1234567890',
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when recipient not found', async () => {
      mockAuthRepository.findByAccountNumber.mockResolvedValue(null);

      await expect(
        service.transfer(1, {
          recipientType: RecipientType.ACCOUNT_NUMBER,
          recipientAccountNumber: '0000000000',
          amount: 100,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
