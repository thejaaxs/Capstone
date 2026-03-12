import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell workflow-page">
      <section class="panel">
        <div class="section-header">
          <div><h2>Payment Monitor</h2><p class="section-subtitle">Observe transaction health, pending settlements, and payment channel mix.</p></div>
        </div>
        <table>
          <thead><tr><th>Booking</th><th>Method</th><th>Status</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>#1001</td><td>UPI</td><td>SUCCESS</td><td>Rs 2,000</td></tr>
            <tr><td>#1002</td><td>Credit Card</td><td>PENDING</td><td>Rs 2,000</td></tr>
            <tr><td>#1003</td><td>Net Banking</td><td>FAILED</td><td>Rs 3,500</td></tr>
          </tbody>
        </table>
      </section>
    </section>
  `
})
export class AdminPaymentsMonitorComponent {}
