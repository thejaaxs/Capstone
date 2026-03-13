import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { BookingsApi } from '../../../api/bookings.service';
import { DealersApi } from '../../../api/dealers.service';
import { LoansApi } from '../../../api/loans.api';
import { TestRidesApi } from '../../../api/test-rides.api';
import { VehiclesApi } from '../../../api/vehicles.service';
import { ProfileContextService } from '../../../core/services/profile-context.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-shell dashboard-page">
      <section class="panel">
        <div class="section-header">
          <div>
            <h2>Dealer Dashboard</h2>
            <p class="section-subtitle">Inventory, test rides, bookings, finance approvals, and delivery scheduling.</p>
          </div>
        </div>

        <div class="metrics-grid">
          <article class="metric-card" *ngFor="let metric of metrics()">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
          </article>
        </div>

        <div class="quick-grid">
          <a class="quick-card" routerLink="/dealer/vehicles">Vehicle Inventory</a>
          <a class="quick-card" routerLink="/dealer/test-rides">Test Ride Requests</a>
          <a class="quick-card" routerLink="/dealer/bookings">Booking Management</a>
          <a class="quick-card" routerLink="/dealer/loan-approvals">Loan Approvals</a>
          <a class="quick-card" routerLink="/dealer/delivery">Delivery Scheduling</a>
          <a class="quick-card" routerLink="/dealer/reviews">Customer Reviews</a>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .dashboard-page { padding: 1rem; }
    .metrics-grid, .quick-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.9rem; }
    .metric-card, .quick-card { border: 1px solid var(--mm-border); border-radius: 16px; background: var(--mm-surface); padding: 1rem; box-shadow: var(--mm-shadow-sm); }
    .metric-card span { color: var(--mm-text-muted); font-size: 0.82rem; }
    .metric-card strong { display: block; margin-top: 0.35rem; color: var(--mm-text); font-size: 1.5rem; }
    .quick-card { color: var(--mm-text); font-weight: 700; }
    @media (max-width: 768px) { .metrics-grid, .quick-grid { grid-template-columns: 1fr; } }
  `]
})
export class DealerOpsDashboardComponent {
  readonly metrics = signal<{ label: string; value: string | number }[]>([
    { label: 'Active inventory', value: '-' },
    { label: 'Pending test rides', value: '-' },
    { label: 'Booking queue', value: '-' },
    { label: 'Loan approvals', value: '-' },
    { label: 'Deliveries this week', value: '-' },
    { label: 'Dealer city', value: '-' }
  ]);

  constructor(
    private profiles: ProfileContextService,
    private vehiclesApi: VehiclesApi,
    private testRidesApi: TestRidesApi,
    private bookingsApi: BookingsApi,
    private loansApi: LoansApi,
    private dealersApi: DealersApi
  ) {
    this.profiles.getDealerId().subscribe((dealerId) => {
      if (!dealerId) return;
      combineLatest([
        this.vehiclesApi.listByDealer(dealerId),
        this.testRidesApi.byDealer(dealerId),
        this.bookingsApi.byDealer(dealerId),
        this.loansApi.byDealer(dealerId),
        this.dealersApi.get(dealerId)
      ]).subscribe(([vehicles, rides, bookings, loans, dealer]) => {
        this.metrics.set([
          { label: 'Active inventory', value: vehicles.length },
          { label: 'Pending test rides', value: rides.filter((ride) => ride.status === 'PENDING').length },
          { label: 'Booking queue', value: bookings.length },
          { label: 'Loan approvals', value: loans.filter((loan) => loan.status === 'PENDING').length },
          { label: 'Deliveries this week', value: bookings.filter((booking) => !!booking.deliveryDate).length },
          { label: 'Dealer city', value: dealer.city || 'Bengaluru' }
        ]);
      });
    });
  }
}
