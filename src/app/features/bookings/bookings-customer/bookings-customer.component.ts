import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, Observable, of, tap } from 'rxjs';
import { BookingsApi } from '../../../api/bookings.service';
import { CustomersApi } from '../../../api/customers.service';
import { DealersApi } from '../../../api/dealers.service';
import { VehiclesApi } from '../../../api/vehicles.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Booking } from '../../../shared/models/booking.model';
import { Customer } from '../../../shared/models/customer.model';
import { Dealer } from '../../../shared/models/dealer.model';
import { Vehicle } from '../../../shared/models/vehicle.model';
import { SectionHeaderComponent } from '../../../shared/ui/section-header.component';
import { SkeletonLoaderComponent } from '../../../shared/ui/skeleton-loader.component';

interface TrackerStep {
  label: string;
  active: boolean;
  current: boolean;
}

interface BookingOrderCard {
  booking: Booking;
  vehicle?: Vehicle;
  dealer?: Dealer;
  tracker: TrackerStep[];
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SectionHeaderComponent, SkeletonLoaderComponent],
  templateUrl: './bookings-customer.component.html',
  styleUrl: './bookings-customer.component.css'
})
export class BookingsCustomerComponent {
  customerId = 0;
  customers: Customer[] = [];
  list: Booking[] = [];
  orderCards: BookingOrderCard[] = [];
  loading = false;
  errorMessage = '';
  placeholderImage = 'https://placehold.co/640x360/e5edf7/36597f?text=MotoMint';

  private readonly currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  private readonly dateFormatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  private vehiclesCache: Vehicle[] = [];
  private dealersCache: Dealer[] = [];
  private vehiclesLoaded = false;
  private dealersLoaded = false;

  constructor(
    private api: BookingsApi,
    private customersApi: CustomersApi,
    private dealersApi: DealersApi,
    private vehiclesApi: VehiclesApi,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    this.loadCustomers();
  }

  private loadCustomers() {
    this.customersApi.list().subscribe({
      next: (res) => {
        this.customers = res;
        const email = this.auth.getEmail();
        const matched = email ? this.customers.find((c) => c.email?.toLowerCase() === email.toLowerCase()) : undefined;
        if (matched?.customerId) {
          this.customerId = matched.customerId;
          this.load();
        } else if (this.customers[0]?.customerId) {
          this.customerId = this.customers[0].customerId;
        }
      },
      error: () => this.toast.error('Failed to load customers'),
    });
  }

  load() {
    if (!this.customerId) {
      this.errorMessage = 'Select a customer profile to view bookings.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      bookings: this.api.byCustomer(this.customerId),
      dealers: this.getDealersCatalog(),
      vehicles: this.getVehiclesCatalog(),
    }).subscribe({
      next: ({ bookings, dealers, vehicles }) => {
        this.list = [...bookings].sort((a, b) => (b.id || 0) - (a.id || 0));
        this.orderCards = this.list.map((booking) => this.toOrderCard(booking, dealers, vehicles));
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = msg || 'Could not load bookings.';
      },
      complete: () => (this.loading = false),
    });
  }

  canCancel(b: Booking): boolean {
    const status = this.normalizeBookingStatus(b.bookingStatus);
    return status === 'REQUESTED' || status === 'ACCEPTED';
  }

  cancel(id: number) {
    this.api.cancel(id).subscribe({
      next: () => {
        this.toast.success('Booking cancelled');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(msg || 'Cancel failed');
      },
    });
  }

  canShowPay(b: Booking): boolean {
    const paymentStatus = (b.paymentStatus || 'UNPAID').toUpperCase();
    const bookingStatus = this.normalizeBookingStatus(b.bookingStatus);
    return !!b.id && paymentStatus !== 'PAID' && bookingStatus !== 'REJECTED' && bookingStatus !== 'CANCELLED';
  }

  canPay(b: Booking): boolean {
    return this.canShowPay(b) && this.normalizeBookingStatus(b.bookingStatus) === 'ACCEPTED';
  }

  canDownloadInvoice(b: Booking): boolean {
    return (b.paymentStatus || '').toUpperCase() === 'PAID';
  }

  payTooltip(b: Booking): string {
    const status = this.normalizeBookingStatus(b.bookingStatus);
    if (status === 'REQUESTED') return 'Waiting for dealer approval';
    if (status === 'REJECTED') return 'Dealer rejected booking';
    if (status === 'CANCELLED') return 'Booking cancelled';
    return 'Proceed to payment';
  }

  openPayment(b: Booking) {
    if (!b.id) return;
    if (!this.canPay(b)) {
      this.toast.info('Booking not approved yet');
      return;
    }
    this.router.navigate(['/customer/pay', b.id], {
      queryParams: { customerId: b.customerId || this.customerId }
    });
  }

  viewVehicle(item: BookingOrderCard) {
    if (!item.booking.vehicleId) return;
    this.router.navigate(['/customer/vehicles', item.booking.vehicleId]);
  }

  track(item: BookingOrderCard) {
    this.toast.info(`Booking ${this.displayBookingStatus(item.booking.bookingStatus)} | Payment ${this.displayPaymentStatus(item.booking.paymentStatus)}`);
  }

  downloadInvoice(item: BookingOrderCard) {
    if (!this.canDownloadInvoice(item.booking)) {
      this.toast.info('Invoice will be available after payment is completed.');
      return;
    }

    const lines = [
      'MotoMint Invoice',
      `Booking ID: #${item.booking.id ?? '-'}`,
      `Vehicle: ${item.vehicle ? `${item.vehicle.brand} ${item.vehicle.name}` : `Vehicle #${item.booking.vehicleId}`}`,
      `Dealer: ${item.dealer?.dealerName || `Dealer #${item.booking.dealerId}`}`,
      `Amount: ${this.formatCurrency(item.booking.amount)}`,
      `Booking Status: ${this.displayBookingStatus(item.booking.bookingStatus)}`,
      `Payment Status: ${this.displayPaymentStatus(item.booking.paymentStatus)}`,
      `Booked On: ${this.formatDate(item.booking.bookingDate || item.booking.createdAt)}`,
      `Delivery Date: ${this.formatDate(item.booking.deliveryDate, 'Not scheduled')}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `motomint-invoice-${item.booking.id ?? 'booking'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  formatCurrency(amount?: number | null): string {
    if (amount == null || !Number.isFinite(Number(amount))) return 'Not available';
    return this.currencyFormatter.format(Number(amount));
  }

  formatDate(value?: string | null, fallback = '-'): string {
    if (!value) return fallback;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return fallback;
    return this.dateFormatter.format(parsed);
  }

  displayBookingStatus(status?: string): string {
    switch (this.normalizeBookingStatus(status)) {
      case 'REQUESTED':
        return 'Placed';
      case 'ACCEPTED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Placed';
    }
  }

  displayPaymentStatus(status?: string): string {
    return (status || 'UNPAID').toUpperCase() === 'PAID' ? 'Paid' : 'Pending';
  }

  private toOrderCard(booking: Booking, dealers: Dealer[], vehicles: Vehicle[]): BookingOrderCard {
    const vehicle = vehicles.find((item) => Number(item.id) === Number(booking.vehicleId));
    const dealer = dealers.find((item) => Number(item.dealerId) === Number(booking.dealerId));

    return {
      booking,
      vehicle,
      dealer,
      tracker: this.buildTracker(booking),
    };
  }

  private buildTracker(booking: Booking): TrackerStep[] {
    const bookingStatus = this.normalizeBookingStatus(booking.bookingStatus);
    const paymentPaid = (booking.paymentStatus || '').toUpperCase() === 'PAID' || bookingStatus === 'CONFIRMED';
    const shipped = bookingStatus === 'CONFIRMED';
    const delivered = shipped && !!booking.deliveryDate && new Date(booking.deliveryDate).getTime() <= Date.now();

    const steps: TrackerStep[] = [
      { label: 'Placed', active: true, current: bookingStatus === 'REQUESTED' },
      { label: 'Paid', active: paymentPaid, current: bookingStatus === 'ACCEPTED' && !paymentPaid },
      { label: 'Shipped', active: shipped, current: shipped && !delivered },
      { label: 'Delivered', active: delivered, current: delivered },
    ];

    if (bookingStatus === 'REJECTED' || bookingStatus === 'CANCELLED') {
      return steps.map((step, index) => ({
        ...step,
        active: index === 0,
        current: index === 0,
      }));
    }

    return steps;
  }

  private getVehiclesCatalog(): Observable<Vehicle[]> {
    if (this.vehiclesLoaded) {
      return of(this.vehiclesCache);
    }

    return this.vehiclesApi.listAll().pipe(
      tap((vehicles) => {
        this.vehiclesCache = vehicles;
        this.vehiclesLoaded = true;
      }),
      catchError(() => {
        this.vehiclesLoaded = true;
        return of([]);
      })
    );
  }

  private getDealersCatalog(): Observable<Dealer[]> {
    if (this.dealersLoaded) {
      return of(this.dealersCache);
    }

    return this.dealersApi.list().pipe(
      tap((dealers) => {
        this.dealersCache = dealers;
        this.dealersLoaded = true;
      }),
      catchError(() => {
        this.dealersLoaded = true;
        return of([]);
      })
    );
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
}
