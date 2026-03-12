import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, of, switchMap } from 'rxjs';
import { DealersApi } from '../../../api/dealers.service';
import { TestRidesApi } from '../../../api/test-rides.api';
import { VehiclesApi } from '../../../api/vehicles.service';
import { ProfileContextService } from '../../../core/services/profile-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { TestRideSlot } from '../../../shared/models/test-ride.model';
import { Vehicle } from '../../../shared/models/vehicle.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-shell workflow-page">
      <section class="panel">
        <div class="section-header">
          <div>
            <h2>Test Ride Booking</h2>
            <p class="section-subtitle">Schedule with dealer approval using dealership slots.</p>
          </div>
        </div>

        <form class="workflow-form" [formGroup]="form" (ngSubmit)="submit()">
          <label>Vehicle
            <input [value]="vehicle()?.name || 'Loading...'" readonly />
          </label>
          <label>Dealer
            <input [value]="dealer()?.dealerName || 'Loading...'" readonly />
          </label>
          <label>Date
            <input type="date" formControlName="bookingDate" (change)="refreshSlots()" />
          </label>
          <label>Time Slot
            <select formControlName="timeSlot">
              <option *ngFor="let slot of slots()" [value]="slot.value" [disabled]="!slot.available">
                {{ slot.label }} {{ slot.available ? '' : '(Unavailable)' }}
              </option>
            </select>
          </label>
          <label>Notes
            <textarea rows="3" formControlName="notes" placeholder="Helmet size, preferred contact time, ID proof status"></textarea>
          </label>

          <div class="slot-row">
            <span class="slot-pill" *ngFor="let slot of slots()" [class.disabled]="!slot.available">{{ slot.label }}</span>
          </div>

          <button class="btn" type="submit" [disabled]="form.invalid || submitting()">{{ submitting() ? 'Submitting...' : 'Book Test Ride' }}</button>
        </form>
      </section>
    </section>
  `,
  styles: [`
    .workflow-page { padding: 1rem; }
    .workflow-form { display: grid; gap: 0.9rem; max-width: 780px; }
    .workflow-form label { display: grid; gap: 0.35rem; }
    .slot-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .slot-pill { border-radius: 999px; padding: 0.35rem 0.7rem; background: var(--mm-primary-100); color: var(--mm-primary-700); font-size: 0.8rem; font-weight: 700; }
    .slot-pill.disabled { background: var(--mm-surface-soft); color: var(--mm-text-muted); }
  `]
})
export class TestRideBookingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly vehiclesApi = inject(VehiclesApi);
  private readonly dealersApi = inject(DealersApi);
  private readonly testRidesApi = inject(TestRidesApi);
  private readonly profiles = inject(ProfileContextService);
  private readonly toast = inject(ToastService);

  readonly vehicle = signal<Vehicle | null>(null);
  readonly dealer = signal<Dealer | null>(null);
  readonly slots = signal<TestRideSlot[]>([]);
  readonly submitting = signal(false);

  readonly form = this.fb.group({
    bookingDate: [new Date().toISOString().slice(0, 10), Validators.required],
    timeSlot: ['10 AM', Validators.required],
    notes: ['']
  });

  private readonly vehicleId = Number(this.route.snapshot.queryParamMap.get('vehicleId') || 0);
  private readonly dealerId = Number(this.route.snapshot.queryParamMap.get('dealerId') || 0);

  constructor() {
    if (this.vehicleId) {
      this.vehiclesApi.getById(this.vehicleId).subscribe((vehicle) => this.vehicle.set(vehicle));
    }
    if (this.dealerId) {
      this.dealersApi.get(this.dealerId).subscribe((dealer) => this.dealer.set(dealer));
    }
    this.refreshSlots();
  }

  refreshSlots(): void {
    const date = this.form.controls.bookingDate.value || new Date().toISOString().slice(0, 10);
    if (!this.dealerId) {
      this.slots.set(this.defaultSlots());
      return;
    }
    this.testRidesApi.listSlots(this.dealerId, date).subscribe({
      next: (slots) => this.slots.set(slots.length ? slots : this.defaultSlots()),
      error: () => this.slots.set(this.defaultSlots())
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.profiles.getCustomerId().pipe(
      switchMap((customerId) => {
        if (!customerId) {
          this.toast.error('Customer profile not resolved.');
          return of(null);
        }
        return this.testRidesApi.create({
          customerId,
          vehicleId: this.vehicleId,
          dealerId: this.dealerId,
          bookingDate: this.form.controls.bookingDate.value || '',
          timeSlot: this.form.controls.timeSlot.value || '',
          status: 'PENDING',
          notes: this.form.controls.notes.value || ''
        });
      }),
      finalize(() => this.submitting.set(false))
    ).subscribe((booking) => {
      if (!booking) return;
      this.toast.success('Test ride request sent to dealer.');
    });
  }

  private defaultSlots(): TestRideSlot[] {
    return ['10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM'].map((label) => ({
      label,
      value: label,
      available: true
    }));
  }
}
