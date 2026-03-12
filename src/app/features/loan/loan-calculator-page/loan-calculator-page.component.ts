import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, of, switchMap } from 'rxjs';
import { LoansApi } from '../../../api/loans.api';
import { VehiclesApi } from '../../../api/vehicles.service';
import { LoanCalculatorService } from '../../../core/services/loan-calculator.service';
import { PricingService } from '../../../core/services/pricing.service';
import { ProfileContextService } from '../../../core/services/profile-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { Vehicle } from '../../../shared/models/vehicle.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-shell workflow-page">
      <section class="panel">
        <div class="section-header">
          <div>
            <h2>EMI Loan Calculator</h2>
            <p class="section-subtitle">Validate downpayment, compare banks, and submit for dealer finance approval.</p>
          </div>
        </div>

        <form class="workflow-form" [formGroup]="form" (ngSubmit)="applyLoan()">
          <div class="loan-grid">
            <label>Provider
              <select formControlName="bank">
                <option *ngFor="let provider of providers" [value]="provider.name">{{ provider.name }}</option>
              </select>
            </label>
            <label>Tenure
              <input type="range" min="12" max="48" step="6" formControlName="tenure" />
              <span>{{ form.controls.tenure.value }} months</span>
            </label>
            <label>Downpayment
              <input type="number" formControlName="downPayment" />
              <small class="field-error" *ngIf="downPaymentInvalid()">Minimum 20% required.</small>
            </label>
          </div>

          <div class="summary-grid" *ngIf="vehicle() && result() as calc">
            <article class="summary-card">
              <h3>Vehicle Summary</h3>
              <p>{{ vehicle()?.name }}</p>
              <strong>{{ breakdown().totalOnRoadPrice | currency:'INR':'symbol':'1.0-0' }}</strong>
            </article>
            <article class="summary-card">
              <h3>EMI</h3>
              <strong>{{ calc.emi | currency:'INR':'symbol':'1.0-0' }}</strong>
              <p>Total payable {{ calc.totalPayable | currency:'INR':'symbol':'1.0-0' }}</p>
            </article>
            <article class="summary-card">
              <h3>Interest Paid</h3>
              <strong>{{ calc.totalInterest | currency:'INR':'symbol':'1.0-0' }}</strong>
              <p>Processing {{ calc.processingFee | currency:'INR':'symbol':'1.0-0' }}</p>
            </article>
          </div>

          <table *ngIf="result()?.schedule?.length">
            <thead><tr><th>Month</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead>
            <tbody>
              <tr *ngFor="let row of result()!.schedule | slice:0:12">
                <td>{{ row.month }}</td>
                <td>{{ row.emi | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ row.principalPaid | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ row.interestPaid | currency:'INR':'symbol':'1.0-0' }}</td>
                <td>{{ row.balance | currency:'INR':'symbol':'1.0-0' }}</td>
              </tr>
            </tbody>
          </table>

          <button class="btn" type="submit" [disabled]="form.invalid || downPaymentInvalid() || submitting()">{{ submitting() ? 'Submitting...' : 'Apply For Loan' }}</button>
        </form>
      </section>
    </section>
  `,
  styles: [`
    .workflow-page { padding: 1rem; }
    .workflow-form { display: grid; gap: 1rem; }
    .loan-grid, .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.9rem; }
    label { display: grid; gap: 0.35rem; }
    .summary-card { border: 1px solid var(--mm-border); border-radius: 16px; padding: 1rem; background: var(--mm-surface-soft); }
    .summary-card strong { color: var(--mm-text); font-size: 1.2rem; }
    @media (max-width: 768px) { .workflow-page { padding: 0.75rem; } .loan-grid, .summary-grid { grid-template-columns: 1fr; } }
  `]
})
export class LoanCalculatorPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly vehiclesApi = inject(VehiclesApi);
  private readonly pricing = inject(PricingService);
  private readonly loanCalculator = inject(LoanCalculatorService);
  private readonly loansApi = inject(LoansApi);
  private readonly profiles = inject(ProfileContextService);
  private readonly toast = inject(ToastService);

  readonly vehicle = signal<Vehicle | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.group({
    bank: [this.loanCalculator.providers[0].name, Validators.required],
    tenure: [24, Validators.required],
    downPayment: [24000, Validators.required]
  });

  readonly providers = this.loanCalculator.providers;
  readonly breakdown = computed(() => this.pricing.calculateBreakdown({
    exShowroomPrice: this.vehicle()?.exShowroomPrice ?? this.vehicle()?.price ?? 120000,
    insurance: this.vehicle()?.insuranceAmount,
    handlingCharges: this.vehicle()?.handlingCharges,
    accessories: this.vehicle()?.accessoriesCost
  }));

  readonly result = computed(() => {
    const provider = this.providers.find((item) => item.name === this.form.controls.bank.value) || this.providers[0];
    return this.loanCalculator.calculate({
      principal: this.breakdown().totalOnRoadPrice,
      annualInterestRate: provider.interestRate,
      tenureMonths: Number(this.form.controls.tenure.value || 24),
      processingFeeRate: provider.processingFeeRate,
      downPayment: Number(this.form.controls.downPayment.value || 0)
    });
  });

  private readonly vehicleId = Number(this.route.snapshot.queryParamMap.get('vehicleId') || 0);
  private readonly dealerId = Number(this.route.snapshot.queryParamMap.get('dealerId') || 0);

  constructor() {
    if (this.vehicleId) {
      this.vehiclesApi.getById(this.vehicleId).subscribe((vehicle) => {
        this.vehicle.set(vehicle);
        this.form.patchValue({
          downPayment: this.pricing.minimumDownPayment(this.pricing.calculateBreakdown({
            exShowroomPrice: vehicle.exShowroomPrice ?? vehicle.price,
            insurance: vehicle.insuranceAmount,
            handlingCharges: vehicle.handlingCharges,
            accessories: vehicle.accessoriesCost
          }).totalOnRoadPrice)
        });
      });
    }
  }

  downPaymentInvalid(): boolean {
    return Number(this.form.controls.downPayment.value || 0) < this.pricing.minimumDownPayment(this.breakdown().totalOnRoadPrice);
  }

  applyLoan(): void {
    if (this.form.invalid || this.downPaymentInvalid()) return;
    const provider = this.providers.find((item) => item.name === this.form.controls.bank.value) || this.providers[0];
    this.submitting.set(true);
    this.profiles.getCustomerId().pipe(
      switchMap((customerId) => {
        if (!customerId) {
          this.toast.error('Customer profile not resolved.');
          return of(null);
        }
        return this.loansApi.create({
          customerId,
          vehicleId: this.vehicleId,
          dealerId: this.dealerId,
          loanAmount: this.result().financedAmount,
          bank: provider.name,
          tenure: Number(this.form.controls.tenure.value || 24),
          downPayment: Number(this.form.controls.downPayment.value || 0),
          interestRate: provider.interestRate,
          processingFeeRate: provider.processingFeeRate,
          status: 'PENDING'
        });
      }),
      finalize(() => this.submitting.set(false))
    ).subscribe((application) => {
      if (!application) return;
      this.toast.success('Loan application submitted to dealer finance officer.');
    });
  }
}
