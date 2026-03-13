import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InvoicesApi } from '../../../api/invoices.api';
import { GstInvoice } from '../../../shared/models/invoice.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell workflow-page">
      <section class="panel invoice-shell">
        <div class="section-header">
          <div>
            <h2>GST Invoice</h2>
            <p class="section-subtitle">Indian GST invoice with dealer details, tax breakup, and payment status.</p>
          </div>
          <div class="card-actions">
            <button class="btn btn-ghost" type="button" (click)="print()">Print</button>
            <button class="btn" type="button" (click)="download()">Download PDF</button>
          </div>
        </div>

        <article class="invoice-card" *ngIf="invoice() as data">
          <div class="invoice-head">
            <div>
              <h3>{{ data.dealerName }}</h3>
              <p>{{ data.dealerAddress }}</p>
              <p>GSTIN: {{ data.dealerGstin }}</p>
            </div>
            <div class="invoice-meta">
              <strong>Invoice #{{ data.invoiceNumber }}</strong>
              <span>Date {{ data.invoiceDate }}</span>
              <span>Payment {{ data.paymentStatus }}</span>
            </div>
          </div>

          <div class="invoice-grid">
            <div>
              <h4>Customer</h4>
              <p>{{ data.customerName }}</p>
              <p>{{ data.customerAddress }}</p>
            </div>
            <div>
              <h4>Vehicle</h4>
              <p>{{ data.vehicleName }}</p>
              <p *ngIf="data.vehicleVin">VIN {{ data.vehicleVin }}</p>
            </div>
          </div>

          <table>
            <thead><tr><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              <tr><td>Vehicle price</td><td>{{ data.vehiclePrice | currency:'INR':'symbol':'1.0-0' }}</td></tr>
              <tr><td>GST 28%</td><td>{{ data.gstAmount | currency:'INR':'symbol':'1.0-0' }}</td></tr>
              <tr><td>Cess</td><td>{{ data.cessAmount | currency:'INR':'symbol':'1.0-0' }}</td></tr>
              <tr><td>Total</td><td><strong>{{ data.totalAmount | currency:'INR':'symbol':'1.0-0' }}</strong></td></tr>
            </tbody>
          </table>
        </article>
      </section>
    </section>
  `,
  styles: [`
    .workflow-page { padding: 1rem; }
    .invoice-shell { display: grid; gap: 1rem; }
    .invoice-card { border: 1px solid var(--mm-border); border-radius: 16px; padding: 1rem; display: grid; gap: 1rem; }
    .invoice-head, .invoice-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .invoice-meta { text-align: right; display: grid; gap: 0.25rem; }
    .invoice-meta strong { color: var(--mm-text); }
    .card-actions { display: flex; gap: 0.5rem; }
    @media (max-width: 768px) { .invoice-head, .invoice-grid { grid-template-columns: 1fr; } .invoice-meta { text-align: left; } }
  `]
})
export class InvoicePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly invoicesApi = inject(InvoicesApi);

  readonly bookingId = Number(this.route.snapshot.queryParamMap.get('bookingId') || 0);
  readonly invoice = signal<GstInvoice>({
    invoiceNumber: `INV-${this.bookingId || 1024}`,
    invoiceDate: new Date().toISOString().slice(0, 10),
    bookingId: this.bookingId || 1024,
    dealerGstin: '29ABCDE1234F1Z5',
    dealerName: 'MotoMint Dealer Pvt Ltd',
    dealerAddress: 'Indiranagar, Bengaluru, Karnataka',
    customerName: 'Customer Name',
    customerAddress: 'Bengaluru, Karnataka',
    vehicleName: 'Premium Scooter',
    vehiclePrice: 120000,
    gstAmount: 33600,
    cessAmount: 0,
    totalAmount: 153600,
    paymentStatus: 'SUCCESS'
  });

  constructor() {
    if (this.bookingId) {
      this.invoicesApi.byBooking(this.bookingId).subscribe({
        next: (invoice) => this.invoice.set(invoice),
        error: () => {}
      });
    }
  }

  print(): void {
    window.print();
  }

  download(): void {
    window.print();
  }
}
