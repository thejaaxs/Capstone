import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingsApi } from '../../../api/bookings.service';
import { Booking } from '../../../shared/models/booking.model';
import { ToastService } from '../../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomersApi } from '../../../api/customers.service';
import { DealersApi } from '../../../api/dealers.service';
import { VehiclesApi } from '../../../api/vehicles.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { Customer } from '../../../shared/models/customer.model';
import { Vehicle } from '../../../shared/models/vehicle.model';
import { AuthService } from '../../../core/services/auth.service';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { SectionHeaderComponent } from '../../../shared/ui/section-header.component';
import { SkeletonLoaderComponent } from '../../../shared/ui/skeleton-loader.component';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, SectionHeaderComponent, SkeletonLoaderComponent],
  templateUrl: './bookings-dealer.component.html',
  styleUrl: './bookings-dealer.component.css'
})
export class BookingsDealerComponent {
  dealerId = 1;
  dealers: Dealer[] = [];
  list: Booking[] = [];
  loading = false;
  errorMessage = '';
  skeletonRows = [1, 2, 3, 4, 5];
  customerNames = new Map<number, string>();
  vehicleLabels = new Map<number, string>();
  private readonly currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  constructor(
    private api: BookingsApi,
    private customersApi: CustomersApi,
    private dealersApi: DealersApi,
    private vehiclesApi: VehiclesApi,
    private auth: AuthService,
    private toast: ToastService
  ) {
    this.loadDealers();
  }

  private loadDealers() {
    this.dealersApi.list().subscribe({
      next: (res) => {
        this.dealers = res;
        const email = this.auth.getEmail();
        const matched = email ? this.dealers.find((d) => d.email?.toLowerCase() === email.toLowerCase()) : undefined;
        if (matched?.dealerId) {
          this.dealerId = matched.dealerId;
          this.load();
        } else if (this.dealers[0]?.dealerId) {
          this.dealerId = this.dealers[0].dealerId;
        }
      },
      error: () => this.toast.error('Failed to load dealers'),
    });
  }

  load() {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      bookings: this.api.byDealer(this.dealerId),
      customers: this.customersApi.list().pipe(catchError(() => of([] as Customer[]))),
      vehicles: this.vehiclesApi.listByDealer(this.dealerId).pipe(catchError(() => of([] as Vehicle[]))),
    }).subscribe({
      next: ({ bookings, customers, vehicles }) => {
        this.customerNames = this.buildCustomerNames(customers);
        this.vehicleLabels = this.buildVehicleLabels(vehicles);
        this.list = bookings;
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = msg || 'Could not load dealer bookings.';
      },
      complete: () => (this.loading = false),
    });
  }

  canConfirm(b: Booking): boolean {
    return this.normalizeBookingStatus(b.bookingStatus) === 'REQUESTED';
  }

  canCancel(b: Booking): boolean {
    return this.normalizeBookingStatus(b.bookingStatus) === 'REQUESTED';
  }

  confirm(id: number) {
    this.api.acceptBooking(id).subscribe({
      next: () => {
        this.toast.success('Booking accepted');
        this.load();
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Accept failed'),
    });
  }

  cancel(id: number) {
    this.api.rejectBooking(id).subscribe({
      next: () => {
        this.toast.success('Booking rejected');
        this.load();
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Reject failed'),
    });
  }

  bookingStatusClass(status?: string): string {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'CONFIRMED') return 'badge-confirmed';
    if (normalized === 'CANCELLED') return 'badge-cancelled';
    return 'badge-pending';
  }

  paymentStatusClass(status?: string): string {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'PAID') return 'badge-paid';
    return 'badge-unpaid';
  }

  getCustomerLabel(customerId: number): string {
    return this.customerNames.get(customerId) || `Customer #${customerId}`;
  }

  getDealerLabel(dealerId: number): string {
    const dealer = this.dealers.find((item) => item.dealerId === dealerId);
    return dealer?.dealerName || `Dealer #${dealerId}`;
  }

  getVehicleLabel(vehicleId: number): string {
    return this.vehicleLabels.get(vehicleId) || `Vehicle #${vehicleId}`;
  }

  formatCurrency(amount?: number): string {
    if (amount == null || !Number.isFinite(Number(amount))) return '-';
    return this.currencyFormatter.format(Number(amount));
  }

  private normalizeBookingStatus(status?: string): 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CONFIRMED' | 'CANCELLED' {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'ACCEPTED') return 'ACCEPTED';
    if (normalized === 'REJECTED') return 'REJECTED';
    if (normalized === 'CONFIRMED') return 'CONFIRMED';
    if (normalized === 'CANCELLED') return 'CANCELLED';
    if (normalized === 'PENDING') return 'REQUESTED';
    return 'REQUESTED';
  }

  private buildCustomerNames(customers: Customer[]): Map<number, string> {
    return new Map(customers
      .filter((customer) => customer.customerId && customer.customerName)
      .map((customer) => [Number(customer.customerId), customer.customerName]));
  }

  private buildVehicleLabels(vehicles: Vehicle[]): Map<number, string> {
    return new Map(vehicles
      .filter((vehicle) => vehicle.id)
      .map((vehicle) => [Number(vehicle.id), `${vehicle.brand} ${vehicle.name}`]));
  }
}

