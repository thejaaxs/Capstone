import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { LoansApi } from '../../../api/loans.api';
import { ProfileContextService } from '../../../core/services/profile-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoanApplication } from '../../../shared/models/loan.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell workflow-page">
      <section class="panel">
        <div class="section-header">
          <div><h2>Loan Approvals</h2><p class="section-subtitle">Approve, reject, or request documents from finance customers.</p></div>
        </div>
        <table>
          <thead><tr><th>Bank</th><th>Loan Amount</th><th>Tenure</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            <tr *ngFor="let loan of loans()">
              <td>{{ loan.bank }}</td>
              <td>{{ loan.loanAmount | currency:'INR':'symbol':'1.0-0' }}</td>
              <td>{{ loan.tenure }} months</td>
              <td>{{ loan.status }}</td>
              <td class="table-actions">
                <button class="btn btn-ghost" type="button" (click)="update(loan, 'APPROVED')">Approve</button>
                <button class="btn btn-ghost" type="button" (click)="update(loan, 'DOCUMENT_REQUIRED')">Docs</button>
                <button class="btn btn-danger" type="button" (click)="update(loan, 'REJECTED')">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  `
})
export class DealerLoanApprovalsComponent {
  readonly loans = signal<LoanApplication[]>([]);

  constructor(
    private profiles: ProfileContextService,
    private loansApi: LoansApi,
    private toast: ToastService
  ) {
    this.load();
  }

  load(): void {
    this.profiles.getDealerId().subscribe((dealerId) => {
      if (!dealerId) return;
      this.loansApi.byDealer(dealerId).subscribe((loans) => this.loans.set(loans));
    });
  }

  update(loan: LoanApplication, status: 'APPROVED' | 'DOCUMENT_REQUIRED' | 'REJECTED'): void {
    if (!loan.id) return;
    this.loansApi.updateStatus(loan.id, { status }).subscribe(() => {
      this.toast.success(`Loan ${status.toLowerCase()}.`);
      this.load();
    });
  }
}
