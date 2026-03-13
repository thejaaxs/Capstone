import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { combineLatest } from 'rxjs';
import { BookingsApi } from '../../../api/bookings.service';
import { CustomersApi } from '../../../api/customers.service';
import { DealersApi } from '../../../api/dealers.service';
import { ReviewsApi } from '../../../api/reviews.service';
import { VehiclesApi } from '../../../api/vehicles.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell dashboard-page">
      <section class="panel">
        <div class="section-header">
          <div><h2>Analytics Dashboard</h2><p class="section-subtitle">Marketplace activity across dealers, vehicles, customers, bookings, and reviews.</p></div>
        </div>
        <div class="metrics-grid">
          <article class="metric-card" *ngFor="let metric of metrics()"><span>{{ metric.label }}</span><strong>{{ metric.value }}</strong></article>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .metrics-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.9rem; }
    .metric-card { border: 1px solid var(--mm-border); border-radius: 16px; background: var(--mm-surface); padding: 1rem; }
    .metric-card span { color: var(--mm-text-muted); font-size: 0.82rem; }
    .metric-card strong { display: block; margin-top: 0.4rem; color: var(--mm-text); font-size: 1.3rem; }
    @media (max-width: 900px) { .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .metrics-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminAnalyticsDashboardComponent {
  readonly metrics = signal<{ label: string; value: string | number }[]>([]);

  constructor(
    dealersApi: DealersApi,
    vehiclesApi: VehiclesApi,
    customersApi: CustomersApi,
    reviewsApi: ReviewsApi,
    bookingsApi: BookingsApi
  ) {
    combineLatest([
      dealersApi.list(),
      vehiclesApi.listAll(),
      customersApi.list(),
      reviewsApi.adminAll(),
      bookingsApi.byDealer(1)
    ]).subscribe(([dealers, vehicles, customers, reviews, bookings]) => {
      this.metrics.set([
        { label: 'Dealers', value: dealers.length },
        { label: 'Vehicles', value: vehicles.length },
        { label: 'Customers', value: customers.length },
        { label: 'Reviews', value: reviews.length },
        { label: 'Tracked bookings', value: bookings.length }
      ]);
    });
  }
}
