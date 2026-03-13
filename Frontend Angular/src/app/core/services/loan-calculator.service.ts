import { Injectable } from '@angular/core';
import { FinanceProvider, LoanCalculationInput, LoanCalculationResult, LoanScheduleItem } from '../../shared/models/loan.model';

@Injectable({ providedIn: 'root' })
export class LoanCalculatorService {
  readonly providers: FinanceProvider[] = [
    { name: 'HDFC Bank', interestRate: 0.095, processingFeeRate: 0.01, maxTenure: 48 },
    { name: 'ICICI Bank', interestRate: 0.1025, processingFeeRate: 0.0125, maxTenure: 48 },
    { name: 'Bajaj Finance', interestRate: 0.11, processingFeeRate: 0.015, maxTenure: 42 },
    { name: 'TVS Credit', interestRate: 0.12, processingFeeRate: 0.0175, maxTenure: 36 },
    { name: 'Hero FinCorp', interestRate: 0.1275, processingFeeRate: 0.02, maxTenure: 36 }
  ];

  calculate(input: LoanCalculationInput): LoanCalculationResult {
    const financedAmount = this.round(Math.max(input.principal - input.downPayment, 0));
    const monthlyRate = input.annualInterestRate / 12;
    const n = Math.max(input.tenureMonths, 1);
    const emi = financedAmount === 0
      ? 0
      : this.round((financedAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1));
    const processingFee = this.round(financedAmount * input.processingFeeRate);
    const schedule: LoanScheduleItem[] = [];

    let balance = financedAmount;
    let totalInterest = 0;

    for (let month = 1; month <= n; month += 1) {
      const interestPaid = this.round(balance * monthlyRate);
      const principalPaid = month === n ? this.round(balance) : this.round(Math.min(balance, emi - interestPaid));
      balance = this.round(Math.max(balance - principalPaid, 0));
      totalInterest = this.round(totalInterest + interestPaid);
      schedule.push({
        month,
        emi,
        principalPaid,
        interestPaid,
        balance
      });
    }

    const totalPayable = this.round(emi * n);
    return {
      financedAmount,
      downPaymentRatio: input.principal ? input.downPayment / input.principal : 0,
      emi,
      totalInterest,
      processingFee,
      totalPayable,
      totalLoanCost: this.round(totalPayable + processingFee + input.downPayment),
      schedule
    };
  }

  private round(value: number): number {
    return Math.round((Number(value) || 0) * 100) / 100;
  }
}
