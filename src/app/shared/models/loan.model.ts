export type LoanStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DOCUMENT_REQUIRED';

export interface FinanceProvider {
  name: string;
  interestRate: number;
  processingFeeRate: number;
  maxTenure: number;
}

export interface LoanCalculationInput {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  processingFeeRate: number;
  downPayment: number;
}

export interface LoanScheduleItem {
  month: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}

export interface LoanCalculationResult {
  financedAmount: number;
  downPaymentRatio: number;
  emi: number;
  totalInterest: number;
  processingFee: number;
  totalPayable: number;
  totalLoanCost: number;
  schedule: LoanScheduleItem[];
}

export interface LoanApplication {
  id?: number;
  customerId: number;
  vehicleId: number;
  dealerId?: number;
  loanAmount: number;
  bank: string;
  tenure: number;
  downPayment: number;
  interestRate: number;
  processingFeeRate?: number;
  status: LoanStatus;
  notes?: string;
}
