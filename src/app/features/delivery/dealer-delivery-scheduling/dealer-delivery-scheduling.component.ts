import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DeliveriesApi } from '../../../api/deliveries.api';
import { ProfileContextService } from '../../../core/services/profile-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { DeliverySchedule } from '../../../shared/models/delivery.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-shell workflow-page">
      <section class="panel">
        <div class="section-header">
          <div><h2>Delivery Scheduling</h2><p class="section-subtitle">Assign delivery slots after payment confirmation.</p></div>
        </div>

        <form class="toolbar" [formGroup]="form" (ngSubmit)="schedule()">
          <div><label>Booking ID</label><input type="number" formControlName="bookingId" /></div>
          <div><label>Customer ID</label><input type="number" formControlName="customerId" /></div>
          <div><label>Date</label><input type="date" formControlName="deliveryDate" /></div>
          <div><label>Time</label><input type="text" formControlName="deliveryTime" placeholder="11:00 AM" /></div>
          <div><label>Location</label><input type="text" formControlName="dealerLocation" placeholder="Showroom address" /></div>
          <button class="btn" type="submit">Schedule</button>
        </form>

        <table>
          <thead><tr><th>Booking</th><th>Date</th><th>Time</th><th>Location</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let item of deliveries()">
              <td>#{{ item.bookingId }}</td>
              <td>{{ item.deliveryDate }}</td>
              <td>{{ item.deliveryTime }}</td>
              <td>{{ item.dealerLocation }}</td>
              <td>{{ item.status }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  `
})
export class DealerDeliverySchedulingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profiles = inject(ProfileContextService);
  private readonly deliveriesApi = inject(DeliveriesApi);
  private readonly toast = inject(ToastService);

  readonly deliveries = signal<DeliverySchedule[]>([]);
  readonly form = this.fb.group({
    bookingId: [1001],
    customerId: [1],
    deliveryDate: [new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)],
    deliveryTime: ['11:00 AM'],
    dealerLocation: ['Bengaluru Showroom']
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.profiles.getDealerId().subscribe((dealerId) => {
      if (!dealerId) return;
      this.deliveriesApi.byDealer(dealerId).subscribe({
        next: (deliveries) => this.deliveries.set(deliveries),
        error: () => this.deliveries.set([])
      });
    });
  }

  schedule(): void {
    this.profiles.getDealerId().subscribe((dealerId) => {
      if (!dealerId) return;
      this.deliveriesApi.create({
        bookingId: Number(this.form.controls.bookingId.value || 0),
        dealerId,
        customerId: Number(this.form.controls.customerId.value || 0),
        deliveryDate: this.form.controls.deliveryDate.value || '',
        deliveryTime: this.form.controls.deliveryTime.value || '',
        dealerLocation: this.form.controls.dealerLocation.value || '',
        status: 'READY_FOR_DELIVERY',
        steps: [
          { label: 'PDI inspection', completed: true },
          { label: 'RTO registration', completed: true },
          { label: 'Number plate', completed: false },
          { label: 'Insurance activation', completed: false },
          { label: 'Handover', completed: false }
        ]
      }).subscribe(() => {
        this.toast.success('Delivery scheduled.');
        this.load();
      });
    });
  }
}
