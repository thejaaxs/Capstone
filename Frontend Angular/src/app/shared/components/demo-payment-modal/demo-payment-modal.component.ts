import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-demo-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" *ngIf="open" (click)="onOverlayClick($event)">
      <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="demo-checkout-title">
        <header class="dialog-head">
          <div>
            <p class="eyebrow">Demo Payment</p>
            <h3 id="demo-checkout-title">{{ title }}</h3>
          </div>
          <button class="close-btn" type="button" aria-label="Close" (click)="close()">x</button>
        </header>

        <div class="summary">
          <p><span>For</span><strong>{{ bookingLabel || 'Selected booking' }}</strong></p>
          <p><span>Amount</span><strong>{{ formatCurrency(amount) }}</strong></p>
        </div>

        <p class="note" *ngIf="note">{{ note }}</p>

        <div class="hint-box">
          <h4>Test Credentials</h4>
          <p>Card: 4111 1111 1111 1111</p>
          <p>CVV: 123</p>
          <p>OTP: 123456</p>
        </div>

        <form class="form" (ngSubmit)="submit()">
          <label for="demo-card-number">Card Number</label>
          <input
            id="demo-card-number"
            type="text"
            [(ngModel)]="model.cardNumber"
            name="cardNumber"
            placeholder="4111 1111 1111 1111"
            inputmode="numeric"
            maxlength="19"
            autocomplete="cc-number"
            required
          />

          <div class="field-row">
            <div>
              <label for="demo-cvv">CVV</label>
              <input
                id="demo-cvv"
                type="password"
                [(ngModel)]="model.cvv"
                name="cvv"
                inputmode="numeric"
                maxlength="3"
                autocomplete="cc-csc"
                required
              />
            </div>
            <div>
              <label for="demo-otp">OTP</label>
              <input
                id="demo-otp"
                type="password"
                [(ngModel)]="model.otp"
                name="otp"
                inputmode="numeric"
                maxlength="6"
                autocomplete="one-time-code"
                required
              />
            </div>
          </div>

          <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="close()">Cancel</button>
            <button type="submit" class="btn">Complete Demo Payment</button>
          </div>
        </form>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .overlay {
      position: fixed;
      inset: 0;
      z-index: 80;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(15, 23, 42, 0.56);
      backdrop-filter: blur(8px);
    }

    .dialog {
      width: min(100%, 460px);
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 18px;
      border: 1px solid var(--border, var(--mm-border));
      background: var(--surface, var(--mm-surface));
      color: var(--text, var(--mm-text));
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
    }

    .dialog-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .eyebrow {
      margin: 0 0 0.2rem;
      color: var(--muted, var(--mm-text-muted));
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .close-btn {
      border: 0;
      background: transparent;
      color: var(--muted, var(--mm-text-muted));
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
    }

    .summary {
      display: grid;
      gap: 0.55rem;
      padding: 0.9rem;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--primary, var(--mm-primary-600)) 14%, var(--border, var(--mm-border)));
      background: color-mix(in srgb, var(--primary, var(--mm-primary-600)) 7%, var(--surface, var(--mm-surface)));
    }

    .summary p {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      margin: 0;
    }

    .summary span,
    .note {
      color: var(--muted, var(--mm-text-muted));
    }

    .note {
      margin: 0;
      font-size: 0.92rem;
    }

    .hint-box {
      padding: 0.9rem;
      border-radius: 14px;
      border: 1px dashed color-mix(in srgb, var(--primary, var(--mm-primary-600)) 32%, var(--border, var(--mm-border)));
      background: color-mix(in srgb, var(--bg, var(--mm-bg)) 72%, var(--surface, var(--mm-surface)));
    }

    .hint-box h4,
    .hint-box p {
      margin: 0;
    }

    .hint-box h4 {
      margin-bottom: 0.45rem;
    }

    .hint-box p + p {
      margin-top: 0.2rem;
    }

    .form {
      display: grid;
      gap: 0.75rem;
    }

    label {
      font-weight: 600;
    }

    input {
      width: 100%;
      border: 1px solid var(--border, var(--mm-border));
      border-radius: 12px;
      padding: 0.82rem 0.9rem;
      background: var(--surface, var(--mm-surface));
      color: var(--text, var(--mm-text));
    }

    .field-row {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .field-row div {
      display: grid;
      gap: 0.45rem;
    }

    .error {
      margin: 0;
      color: #dc2626;
      font-size: 0.9rem;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.7rem;
      flex-wrap: wrap;
    }

    .btn {
      border: 0;
      border-radius: 999px;
      padding: 0.78rem 1.15rem;
      font-weight: 700;
      cursor: pointer;
      background: var(--primary, var(--mm-primary-600));
      color: #fff;
    }

    .btn-ghost {
      background: transparent;
      color: var(--text, var(--mm-text));
      border: 1px solid var(--border, var(--mm-border));
    }

    @media (max-width: 560px) {
      .dialog {
        padding: 1rem;
      }

      .summary p {
        flex-direction: column;
        align-items: flex-start;
      }

      .field-row {
        grid-template-columns: 1fr;
      }

      .actions {
        flex-direction: column-reverse;
      }

      .actions .btn {
        width: 100%;
      }
    }
  `]
})
export class DemoPaymentModalComponent implements OnChanges {
  @Input() open = false;
  @Input() amount = 0;
  @Input() bookingLabel = '';
  @Input() title = 'MotoMint Test Checkout';
  @Input() note = '';

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  model = {
    cardNumber: '',
    cvv: '',
    otp: '',
  };

  errorMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue) {
      this.resetForm();
    }
  }

  submit(): void {
    const normalizedCard = this.model.cardNumber.replace(/\s+/g, '');
    const normalizedCvv = this.model.cvv.trim();
    const normalizedOtp = this.model.otp.trim();

    if (normalizedCard !== '4111111111111111' || normalizedCvv !== '123' || normalizedOtp !== '123456') {
      this.errorMessage = 'Use the test card details shown above to complete the demo payment.';
      return;
    }

    this.errorMessage = '';
    this.confirmed.emit();
  }

  close(): void {
    this.resetForm();
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  }

  private resetForm(): void {
    this.model = {
      cardNumber: '',
      cvv: '',
      otp: '',
    };
    this.errorMessage = '';
  }
}
