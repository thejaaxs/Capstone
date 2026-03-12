import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DeliveriesApi } from '../../../api/deliveries.api';
import { ProfileContextService } from '../../../core/services/profile-context.service';
import { DeliverySchedule } from '../../../shared/models/delivery.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-shell workflow-page">
      <section class="panel">
        <div class="section-header">
          <div>
            <h2>Delivery Status</h2>
            <p class="section-subtitle">Track PDI, RTO registration, number plate, insurance activation, and handover.</p>
          </div>
          <a routerLink="/customer/invoice" [queryParams]="{ bookingId: bookingId }" class="btn btn-ghost">View Invoice</a>
        </div>

        <article class="delivery-card" *ngFor="let delivery of deliveries()">
          <div class="delivery-head">
            <div>
              <h3>{{ delivery.status }}</h3>
              <p>{{ delivery.deliveryDate }} at {{ delivery.deliveryTime }}</p>
            </div>
            <strong>{{ delivery.dealerLocation }}</strong>
          </div>
          <div class="step-grid">
            <div class="step-item" *ngFor="let step of delivery.steps" [class.done]="step.completed">{{ step.label }}</div>
          </div>
        </article>
      </section>
    </section>
  `,
  styles: [`
    .workflow-page { padding: 1rem; }
    .delivery-card { border: 1px solid var(--mm-border); border-radius: 16px; padding: 1rem; display: grid; gap: 0.8rem; }
    .delivery-head { display: flex; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
    .delivery-head strong { color: var(--mm-text); }
    .step-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.7rem; }
    .step-item { padding: 0.8rem; border-radius: 12px; background: var(--mm-surface-soft); border: 1px solid var(--mm-border); color: var(--mm-text-muted); font-size: 0.84rem; }
    .step-item.done { background: color-mix(in srgb, var(--mm-success) 18%, var(--mm-surface)); color: var(--mm-text); }
    @media (max-width: 768px) { .step-grid { grid-template-columns: 1fr; } }
  `]
})
export class DeliveryStatusComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly deliveriesApi = inject(DeliveriesApi);
  private readonly profiles = inject(ProfileContextService);

  readonly deliveries = signal<DeliverySchedule[]>([]);
  readonly bookingId = Number(this.route.snapshot.queryParamMap.get('bookingId') || 0);

  constructor() {
    this.profiles.getCustomerId().subscribe((customerId) => {
      if (!customerId) {
        this.deliveries.set([this.fallbackDelivery()]);
        return;
      }
      this.deliveriesApi.byCustomer(customerId).subscribe({
        next: (deliveries) => this.deliveries.set(deliveries.length ? deliveries : [this.fallbackDelivery()]),
        error: () => this.deliveries.set([this.fallbackDelivery()])
      });
    });
  }

  private fallbackDelivery(): DeliverySchedule {
    return {
      bookingId: this.bookingId,
      dealerId: 1,
      customerId: 1,
      deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      deliveryTime: '11:00 AM',
      dealerLocation: 'Bengaluru Showroom',
      status: 'READY_FOR_DELIVERY',
      steps: [
        { label: 'PDI inspection', completed: true },
        { label: 'RTO registration', completed: true },
        { label: 'Number plate', completed: true },
        { label: 'Insurance activation', completed: true },
        { label: 'Handover', completed: false }
      ]
    };
  }
}
