import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';

interface LoanOffer {
  lender: string;
  rate: string;
  tenure: string;
  note: string;
  link: string;
  linkLabel: string;
}

@Component({
  standalone: true,
  selector: 'app-loan-info',
  imports: [CommonModule],
  template: `
    <article class="loan-card">
      <header class="loan-head">
        <div>
          <p class="eyebrow">Finance Help</p>
          <h3>Need bank help?</h3>
        </div>
        <button type="button" class="btn btn-ghost compact-btn" (click)="openModal()">
          View Options
        </button>
      </header>

      <p class="intro">
        Check SBI, HDFC Bank, and ICICI Bank loan pages without expanding this vehicle details page.
      </p>

      <div class="bank-chip-row">
        <span class="bank-chip" *ngFor="let offer of offers">{{ offer.lender }}</span>
      </div>

      <p class="disclaimer">
        Indicative bank information only. Final approval depends on lender terms and eligibility.
      </p>
    </article>

    <div class="bank-modal-overlay" *ngIf="modalOpen" (click)="closeModal()">
      <section
        class="bank-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-help-title"
        (click)="$event.stopPropagation()"
      >
        <header class="bank-modal-head">
          <div>
            <p class="eyebrow">Finance Help</p>
            <h3 id="bank-help-title">Need bank help?</h3>
          </div>
          <button type="button" class="close-btn" (click)="closeModal()" aria-label="Close bank help">
            x
          </button>
        </header>

        <p class="modal-copy">
          Visit the official lender pages below for loan details, eligibility, and application steps.
        </p>

        <div class="offer-list">
          <article class="offer-item" *ngFor="let offer of offers">
            <div class="offer-copy">
              <h4>{{ offer.lender }}</h4>
              <p>{{ offer.note }}</p>
            </div>

            <div class="offer-stats">
              <div class="stat">
                <span>Starting rate</span>
                <strong>{{ offer.rate }}</strong>
              </div>
              <div class="stat">
                <span>Max tenure</span>
                <strong>{{ offer.tenure }}</strong>
              </div>
            </div>

            <a class="btn" [href]="offer.link" target="_blank" rel="noopener noreferrer">
              {{ offer.linkLabel }}
            </a>
          </article>
        </div>

        <p class="disclaimer">
          External links open the original bank websites. Rates and policies can change at the lender's discretion.
        </p>
      </section>
    </div>
  `,
  styleUrl: './loan-info.component.css'
})
export class LoanInfoComponent {
  modalOpen = false;

  readonly offers: LoanOffer[] = [
    {
      lender: 'SBI',
      rate: 'Starting from 9.25% p.a.',
      tenure: 'Up to 60 months',
      note: 'Official SBI vehicle and two-wheeler loan information.',
      link: 'https://sbi.co.in/web/personal-banking/loans/auto-loans/sbi-two-wheeler-loan-scheme',
      linkLabel: 'Open SBI'
    },
    {
      lender: 'HDFC Bank',
      rate: 'Starting from 9.50% p.a.',
      tenure: 'Up to 72 months',
      note: 'Official HDFC Bank two-wheeler loan page.',
      link: 'https://www.hdfcbank.com/personal/borrow/popular-loans/two-wheeler-loan',
      linkLabel: 'Open HDFC Bank'
    },
    {
      lender: 'ICICI Bank',
      rate: 'Starting from 9.75% p.a.',
      tenure: 'Up to 60 months',
      note: 'Official ICICI Bank two-wheeler loan page.',
      link: 'https://www.icicibank.com/personal-banking/loans/two-wheeler-loan',
      linkLabel: 'Open ICICI Bank'
    }
  ];

  openModal(): void {
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.modalOpen) {
      this.closeModal();
    }
  }
}
