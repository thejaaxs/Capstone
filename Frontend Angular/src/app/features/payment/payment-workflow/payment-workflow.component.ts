import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, timer } from 'rxjs';
import { PaymentsApiService } from '../../../api/payments.api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-shell workflow-page">
      <section class="panel">
        <div class="section-header">
          <div>
            <h2>Payment Processing</h2>
            <p class="section-subtitle">Simulated dealership payment with UPI, card, net banking, or cash at dealership.</p>
          </div>
        </div>

        <div class="payment-methods">
          <button *ngFor="let method of methods" class="payment-option" [class.active]="selectedMethod() === method.value" (click)="selectedMethod.set(method.value)">
            <strong>{{ method.label }}</strong>
            <span>{{ method.caption }}</span>
          </button>
        </div>

        <div class="status-panel">
          <p><span>Booking</span><strong>#{{ bookingId }}</strong></p>
          <p><span>Status</span><strong>{{ paymentState() }}</strong></p>
        </div>

        <div class="card-actions">
          <button class="btn" type="button" [disabled]="processing()" (click)="pay()">{{ processing() ? 'Processing...' : 'Pay Now' }}</button>
          <a routerLink="/customer/delivery" [queryParams]="{ bookingId: bookingId }" class="btn btn-ghost">Track Delivery</a>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .workflow-page { padding: 1rem; }
    .payment-methods { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.8rem; margin-bottom: 1rem; }
    .payment-option { text-align: left; display: grid; gap: 0.25rem; background: var(--mm-surface); color: var(--mm-text); border: 1px solid var(--mm-border); padding: 0.9rem; }
    .payment-option.active { border-color: var(--mm-primary-500); background: color-mix(in srgb, var(--mm-primary-100) 66%, var(--mm-surface)); }
    .payment-option span { color: var(--mm-text-muted); font-size: 0.82rem; }
    .status-panel { border: 1px solid var(--mm-border); border-radius: 16px; padding: 1rem; display: grid; gap: 0.4rem; margin-bottom: 1rem; }
    .status-panel p { margin: 0; display: flex; justify-content: space-between; }
    .status-panel strong { color: var(--mm-text); }
    .card-actions { display: flex; gap: 0.5rem; }
    @media (max-width: 768px) { .payment-methods { grid-template-columns: 1fr; } .card-actions { flex-direction: column; } }
  `]
})
export class PaymentWorkflowComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentsApi = inject(PaymentsApiService);
  private readonly toast = inject(ToastService);

  readonly selectedMethod = signal<'UPI' | 'CREDIT_CARD' | 'NET_BANKING' | 'CASH_AT_DEALERSHIP'>('UPI');
  readonly paymentState = signal<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');
  readonly processing = signal(false);

  readonly bookingId = Number(this.route.snapshot.queryParamMap.get('bookingId') || 0);
  readonly customerId = Number(this.route.snapshot.queryParamMap.get('customerId') || 1);

  readonly methods = [
    { label: 'UPI', value: 'UPI' as const, caption: 'Instant payment' },
    { label: 'Credit Card', value: 'CREDIT_CARD' as const, caption: 'EMI eligible' },
    { label: 'Net Banking', value: 'NET_BANKING' as const, caption: 'Bank redirect' },
    { label: 'Cash at dealership', value: 'CASH_AT_DEALERSHIP' as const, caption: 'Pay during pickup' }
  ];

  constructor() {}

  pay(): void {
    this.processing.set(true);
    this.paymentState.set('PENDING');
    this.paymentsApi.pay({
      bookingId: this.bookingId,
      customerId: this.customerId,
      amount: 2000,
      method: this.selectedMethod()
    }).pipe(
      finalize(() => this.processing.set(false))
    ).subscribe({
      next: (response) => {
        this.paymentState.set((response.status as 'SUCCESS' | 'FAILED' | 'PENDING') || 'SUCCESS');
        this.handleResult(response.status);
      },
      error: () => {
        timer(1200).subscribe(() => {
          this.paymentState.set('SUCCESS');
          this.handleResult('SUCCESS');
        });
      }
    });
  }

  private handleResult(status: string): void {
    if (status === 'SUCCESS') {
      this.toast.success('Payment completed.');
      this.router.navigate(['/customer/delivery'], {
        queryParams: { bookingId: this.bookingId }
      });
      return;
    }
    if (status === 'FAILED') {
      this.toast.error('Payment failed. Try another method.');
      return;
    }
    this.toast.info('Payment is pending confirmation.');
  }
}
