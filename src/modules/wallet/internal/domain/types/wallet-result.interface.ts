export interface DepositResult {
  reference: string;
  amount: number;
  previousBalance: number;
  currentBalance: number;
}

export interface TransferResult {
  debitRef: string;
  creditRef: string;
  amount: number;
  senderPreviousBalance: number;
  senderCurrentBalance: number;
}
