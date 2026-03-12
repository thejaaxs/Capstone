import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import { BookingsApi } from '../../../api/bookings.service';
import { DealersApi } from '../../../api/dealers.service';
import { VehiclesApi } from '../../../api/vehicles.service';
import { PricingService } from '../../../core/services/pricing.service';
import { ProfileContextService } from '../../../core/services/profile-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { Vehicle } from '../../../shared/models/vehicle.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-shell workflow-page">
      <section class="panel">
        <div class="section-header">
          <div>
            <h2>Booking Confirmation</h2>
            <p class="section-subtitle">Finalize dealer, booking amount, finance mode, and expected delivery timeline.</p>
          </div>
          <a routerLink="/customer/vehicles" class="btn btn-ghost">Change Vehicle</a>
        </div>

        <div class="state-card" *ngIf="loading()"> <div class="spinner"></div> <p>Loading booking context...</p> </div>

        <form *ngIf="!loading() && vehicle() && dealer()" class="workflow-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="summary-grid">
            <article class="summary-card">
              <h3>{{ vehicle()?.name }}</h3>
              <p>{{ dealer()?.dealerName }} | {{ dealer()?.city || 'India' }}</p>
              <strong>{{ breakdown().totalOnRoadPrice | currency:'INR':'symbol':'1.0-0' }}</strong>
            </article>
            <article class="summary-card">
              <h3>Pricing</h3>
              <p>RTO {{ breakdown().rtoCharges | currency:'INR':'symbol':'1.0-0' }}</p>
              <p>Insurance {{ breakdown().insurance | currency:'INR':'symbol':'1.0-0' }}</p>
              <p>Handling {{ breakdown().handlingCharges | currency:'INR':'symbol':'1.0-0' }}</p>
            </article>
            <article class="summary-card">
              <h3>Invoice Preview</h3>
              <p>GST 28%: {{ (breakdown().totalInvoiceAmount - breakdown().exShowroomPrice - (breakdown().cess ?? 0)) | currency:'INR':'symbol':'1.0-0' }}</p>
              <p>Cess: {{ (breakdown().cess ?? 0) | currency:'INR':'symbol':'1.0-0' }}</p>
              <strong>{{ breakdown().totalInvoiceAmount | currency:'INR':'symbol':'1.0-0' }}</strong>
            </article>
          </div>

          <div class="booking-grid">
            <label>Booking Amount
              <input type="number" formControlName="bookingAmount" />
              <small class="field-error" *ngIf="bookingAmountInvalid()">Booking amount must be between Rs 1000 and Rs 5000.</small>
            </label>
            <label>Delivery Preference
              <input type="date" formControlName="deliveryDate" />
            </label>
            <label>Purchase Mode
              <select formControlName="purchaseMode">
                <option value="FULL_PAYMENT">Full Payment</option>
                <option value="EMI">EMI / Loan</option>
              </select>
            </label>
          </div>

          <div class="card-actions">
            <button class="btn" type="submit" [disabled]="submitting() || form.invalid || bookingAmountInvalid()">{{ submitting() ? 'Creating...' : 'Create Booking' }}</button>
            <button class="btn btn-ghost" type="button" (click)="openLoanCalculator()">Open EMI Calculator</button>
          </div>
        </form>
      </section>
    </section>
  `,
  styles: [`
    .workflow-page { padding: 1rem; }
    .workflow-form, .summary-grid, .booking-grid { display: grid; gap: 0.9rem; }
    .summary-grid, .booking-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .summary-card { border: 1px solid var(--mm-border); border-radius: 16px; background: var(--mm-surface-soft); padding: 1rem; }
    .summary-card p { margin: 0.25rem 0; }
    label { display: grid; gap: 0.35rem; }
    .card-actions { display: flex; gap: 0.5rem; }
    @media (max-width: 768px) { .workflow-page { padding: 0.75rem; } .summary-grid, .booking-grid { grid-template-columns: 1fr; } .card-actions { flex-direction: column; } }
  `]
})
export class BookingConfirmationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vehiclesApi = inject(VehiclesApi);
  private readonly dealersApi = inject(DealersApi);
  private readonly pricing = inject(PricingService);
  private readonly bookingsApi = inject(BookingsApi);
  private readonly profiles = inject(ProfileContextService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly vehicle = signal<Vehicle | null>(null);
  readonly dealer = signal<Dealer | null>(null);

  readonly form = this.fb.group({
    bookingAmount: [2000, Validators.required],
    deliveryDate: [new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), Validators.required],
    purchaseMode: ['FULL_PAYMENT', Validators.required]
  });

  private readonly vehicleId = Number(this.route.snapshot.queryParamMap.get('vehicleId') || 0);
  private readonly dealerId = Number(this.route.snapshot.queryParamMap.get('dealerId') || 0);

  constructor() {
    forkJoin({
      vehicle: this.vehiclesApi.getById(this.vehicleId),
      dealer: this.dealersApi.get(this.dealerId)
    }).subscribe({
      next: ({ vehicle, dealer }) => {
        this.vehicle.set(vehicle);
        this.dealer.set(dealer);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  breakdown() {
    return this.pricing.calculateBreakdown({
      exShowroomPrice: this.vehicle()?.exShowroomPrice ?? this.vehicle()?.price ?? 120000,
      insurance: this.vehicle()?.insuranceAmount,
      handlingCharges: this.vehicle()?.handlingCharges,
      accessories: this.vehicle()?.accessoriesCost
    });
  }

  bookingAmountInvalid(): boolean {
    const amount = Number(this.form.controls.bookingAmount.value || 0);
    return amount < 1000 || amount > 5000;
  }

  submit(): void {
    if (this.form.invalid || this.bookingAmountInvalid()) return;
    this.submitting.set(true);
    this.profiles.getCustomerId().pipe(
      switchMap((customerId) => {
        if (!customerId) {
          this.toast.error('Customer profile not resolved.');
          return of(null);
        }
        return this.bookingsApi.create({
          customerId,
          vehicleId: this.vehicleId,
          dealerId: this.dealerId,
          bookingAmount: Number(this.form.controls.bookingAmount.value || 2000),
          amount: this.breakdown().totalOnRoadPrice,
          deliveryDate: this.form.controls.deliveryDate.value || ''
        });
      }),
      finalize(() => this.submitting.set(false))
    ).subscribe((booking) => {
      if (!booking?.id) return;
      this.toast.success('Vehicle booking created.');
      this.router.navigate(['/customer/payment'], {
        queryParams: {
          bookingId: booking.id,
          dealerId: this.dealerId,
          vehicleId: this.vehicleId,
          mode: this.form.controls.purchaseMode.value || 'FULL_PAYMENT'
        }
      });
    });
  }

  openLoanCalculator(): void {
    this.router.navigate(['/customer/loan'], {
      queryParams: { vehicleId: this.vehicleId, dealerId: this.dealerId }
    });
  }
}
