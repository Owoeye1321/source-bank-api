export interface WalletResponse {
  id: number;
  accountBalance: string;
  accountNumber: string;
}

export interface DepositResponse {
  reference: string;
  amount: string;
  previousBalance: string;
  currentBalance: string;
}

export interface TransferResponse {
  reference: string;
  amount: string;
  previousBalance: string;
  currentBalance: string;
  recipient: {
    accountNumber: string;
    email: string;
  };
}
