import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  CreateOrderReq,
  CreateOrderRes,
  PaymentsApi,
  VerifyReq,
  VerifyRes
} from '../../../api/payments.service';
import { ToastService } from '../../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomersApi } from '../../../api/customers.service';
import { Customer } from '../../../shared/models/customer.model';
import { BookingsApi } from '../../../api/bookings.service';
import { Booking } from '../../../shared/models/booking.model';
import { AuthService } from '../../../core/services/auth.service';
import { finalize, forkJoin, of } from 'rxjs';
import { DealersApi } from '../../../api/dealers.service';
import { VehiclesApi } from '../../../api/vehicles.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { Vehicle } from '../../../shared/models/vehicle.model';
import { catchError } from 'rxjs/operators';
import { DemoPaymentModalComponent } from '../../../shared/components/demo-payment-modal/demo-payment-modal.component';

interface RazorpaySuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailurePayload {
  error?: {
    description?: string;
    reason?: string;
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  order_id: string;
  method?: {
    card?: boolean;
    upi?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    emi?: boolean;
  };
  handler: (payload: RazorpaySuccessPayload) => void;
  prefill?: {
    email?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', callback: (payload: RazorpayFailurePayload) => void): void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

interface PaymentFormModel extends CreateOrderReq {
  amount: number;
  paymentMethod: 'CARD' | 'UPI';
}

const MOCK_PAYMENT_SIGNATURE = 'mock_signature';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, DemoPaymentModalComponent],
  templateUrl: './payment-create.component.html',
  styleUrl: './payment-create.component.css'
})
export class PaymentCreateComponent {
  model: PaymentFormModel = { bookingId: 0, customerId: 0, amount: 0, paymentMethod: 'UPI' };
  customers: Customer[] = [];
  bookings: Booking[] = [];
  processing = false;
  result?: VerifyRes;
  selectedBooking?: Booking;
  selectedDealer?: Dealer;
  selectedVehicle?: Vehicle;
  demoCheckoutOpen = false;
  demoCheckoutMessage = '';
  private demoOrder?: CreateOrderRes;

  private razorpayLoader?: Promise<void>;

  constructor(
    private api: PaymentsApi,
    private customersApi: CustomersApi,
    private bookingsApi: BookingsApi,
    private dealersApi: DealersApi,
    private vehiclesApi: VehiclesApi,
    private route: ActivatedRoute,
    private auth: AuthService,
    private toast: ToastService
  ) {
    this.initializeCustomerContext();
  }

  private initializeCustomerContext() {
    const routeCustomerId = Number(this.route.snapshot.queryParamMap.get('customerId') || '0');
    const cachedCustomerId = this.auth.getCustomerId() || 0;
    const resolvedCustomerId = routeCustomerId > 0 ? routeCustomerId : cachedCustomerId;

    if (resolvedCustomerId > 0) {
      this.model.customerId = resolvedCustomerId;
      this.auth.setCustomerId(resolvedCustomerId);
      this.customers = [this.buildCurrentCustomerOption(resolvedCustomerId)];
      this.loadBookings();
      return;
    }

    this.loadCustomers();
  }

  private loadCustomers() {
    this.customersApi.list().subscribe({
      next: (res) => {
        this.customers = res;
        const email = this.auth.getEmail();
        const matched = email ? this.customers.find((c) => c.email?.toLowerCase() === email.toLowerCase()) : undefined;
        if (matched?.customerId) {
          this.model.customerId = matched.customerId;
          this.auth.setCustomerId(matched.customerId);
        } else if (this.customers[0]?.customerId) {
          this.model.customerId = this.customers[0].customerId;
          this.auth.setCustomerId(this.customers[0].customerId);
        }
        if (this.model.customerId) this.loadBookings();
      },
      error: () => this.toast.error('Failed to load customers'),
    });
  }

  loadBookings() {
    if (!this.model.customerId) return;
    this.auth.setCustomerId(this.model.customerId);
    this.bookingsApi.byCustomer(this.model.customerId).subscribe({
      next: (res) => {
        this.bookings = res.filter((b) => b.bookingStatus !== 'CANCELLED');
        this.selectedBooking = undefined;
        this.selectedDealer = undefined;
        this.selectedVehicle = undefined;
        this.demoCheckoutOpen = false;
        this.demoCheckoutMessage = '';
        this.demoOrder = undefined;
        if (this.bookings[0]?.id) {
          this.selectBooking(this.bookings[0].id);
        }
      },
      error: () => this.toast.error('Failed to load bookings'),
    });
  }

  selectBooking(bookingId: number) {
    const booking = this.bookings.find((b) => b.id === Number(bookingId));
    if (!booking?.id) return;
    this.selectedBooking = booking;
    this.model.bookingId = booking.id;
    this.model.amount = booking.amount ?? 0;
    this.resolveBookingSummary(booking);
  }

  submit() {
    if (!this.model.customerId || this.model.customerId <= 0) {
      this.toast.error('Please select a valid customer.');
      return;
    }
    if (!this.model.bookingId || this.model.bookingId <= 0) {
      this.toast.error('Please select a valid booking.');
      return;
    }
    if (!this.lockedAmount || this.lockedAmount <= 0) {
      this.toast.error('Amount must be greater than 0.');
      return;
    }

    this.model.amount = this.lockedAmount;
    this.processing = true;
    this.result = undefined;
    this.demoCheckoutOpen = false;
    this.demoCheckoutMessage = '';
    this.demoOrder = undefined;
    this.api.createOrder({ bookingId: this.model.bookingId, customerId: this.model.customerId }).subscribe({
      next: (order) => {
        this.openRazorpay(order);
      },
      error: (err: HttpErrorResponse) => {
        this.processing = false;
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(backendMessage || 'Failed to create Razorpay order.');
      }
    });
  }

  private async openRazorpay(order: CreateOrderRes) {
    const orderId = this.readFirstNonEmpty([order.razorpayOrderId]);
    const key = this.readFirstNonEmpty([order.keyId]);
    const amount = this.resolveCheckoutAmount(order.amountInPaise);
    const currency = this.readFirstNonEmpty([order.currency, 'INR']).toUpperCase();

    if (!orderId || !amount) {
      this.processing = false;
      this.toast.error('Invalid create-order response from server.');
      return;
    }

    if (this.hasAmountMismatch(amount)) {
      this.toast.info(this.buildAmountMismatchMessage(amount));
    }

    if (order.mockMode) {
      this.processing = false;
      this.demoOrder = order;
      this.demoCheckoutMessage = order.message || 'Demo payment mode is enabled for this transaction.';
      this.demoCheckoutOpen = true;
      return;
    }

    if (!key) {
      this.processing = false;
      this.toast.error('Invalid create-order response from server.');
      return;
    }

    try {
      await this.ensureRazorpayLoaded();
    } catch {
      this.processing = false;
      this.toast.error('Unable to load Razorpay checkout. Please try again.');
      return;
    }

    const razorpayCtor = this.getRazorpayConstructor();
    if (!razorpayCtor) {
      this.processing = false;
      this.toast.error('Razorpay checkout is unavailable.');
      return;
    }

    const checkout = new razorpayCtor({
      key,
      amount,
      currency,
      name: 'MotoMint',
      description: `Booking #${this.model.bookingId}`,
      order_id: orderId,
      method: {
        card: this.model.paymentMethod === 'CARD',
        upi: this.model.paymentMethod === 'UPI',
        netbanking: false,
        wallet: false,
        emi: false,
      },
      prefill: {
        email: this.auth.getEmail() || undefined,
      },
      handler: (payload: RazorpaySuccessPayload) => {
        this.verifyPayment(payload, orderId, order);
      },
      modal: {
        ondismiss: () => {
          this.processing = false;
          this.toast.info('Payment was cancelled.');
        }
      }
    });

    checkout.on('payment.failed', (payload) => {
      this.processing = false;
      this.toast.error(this.extractFailureReason(payload));
    });

    checkout.open();
  }

  private verifyPayment(payload: RazorpaySuccessPayload, fallbackOrderId: string, order: CreateOrderRes) {
    const orderId = this.readFirstNonEmpty([payload.razorpay_order_id, fallbackOrderId]);
    const verifyPayload: VerifyReq = {
      bookingId: this.model.bookingId,
      customerId: this.model.customerId,
      razorpayOrderId: orderId,
      razorpayPaymentId: payload.razorpay_payment_id,
      razorpaySignature: payload.razorpay_signature,
      razorpay_order_id: payload.razorpay_order_id || order.razorpayOrderId,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
    };

    this.api.verify(verifyPayload)
      .pipe(finalize(() => { this.processing = false; }))
      .subscribe({
        next: (res) => {
          this.result = res;
          const txn = res.transactionId ? ` | TXN: ${res.transactionId}` : '';
          this.toast.success(res.message || `Payment ${res.status}${txn}`);
        },
        error: (err: HttpErrorResponse) => {
          const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
          this.toast.error(backendMessage || 'Payment verification failed.');
        }
      });
  }

  private buildMockSuccessPayload(orderId: string): RazorpaySuccessPayload {
    return {
      razorpay_order_id: orderId,
      razorpay_payment_id: `mock_payment_${this.model.bookingId}_${Date.now()}`,
      razorpay_signature: MOCK_PAYMENT_SIGNATURE,
    };
  }

  private resolveCheckoutAmount(rawAmount?: number): number {
    if (typeof rawAmount === 'number' && Number.isFinite(rawAmount) && rawAmount > 0) {
      return rawAmount;
    }
    return Math.round(this.lockedAmount * 100);
  }

  private readFirstNonEmpty(values: Array<string | undefined>): string {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return '';
  }

  private extractFailureReason(payload: RazorpayFailurePayload): string {
    const reason = payload.error?.description || payload.error?.reason;
    return reason ? `Payment failed: ${reason}` : 'Payment failed. Please try again.';
  }

  private ensureRazorpayLoaded(): Promise<void> {
    if (this.getRazorpayConstructor()) {
      return Promise.resolve();
    }

    if (this.razorpayLoader) {
      return this.razorpayLoader;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
    if (existing) {
      this.razorpayLoader = new Promise<void>((resolve, reject) => {
        if (this.getRazorpayConstructor()) {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay script.')), { once: true });
      }).catch((err) => {
        this.razorpayLoader = undefined;
        throw err;
      });
      return this.razorpayLoader;
    }

    this.razorpayLoader = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.defer = true;
      script.dataset['razorpayCheckout'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay script.'));
      document.body.appendChild(script);
    }).catch((err) => {
      this.razorpayLoader = undefined;
      throw err;
    });

    return this.razorpayLoader;
  }

  private getRazorpayConstructor(): RazorpayConstructor | undefined {
    return (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  }

  get lockedAmount(): number {
    const amount = Number(this.selectedBooking?.amount || 0);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
  }

  get selectedVehicleLabel(): string {
    if (!this.selectedVehicle) return this.selectedBooking?.vehicleId ? `Vehicle #${this.selectedBooking.vehicleId}` : '-';
    return `${this.selectedVehicle.brand} ${this.selectedVehicle.name}`;
  }

  formatCurrency(amount?: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  }

  private resolveBookingSummary(booking: Booking) {
    this.selectedDealer = undefined;
    this.selectedVehicle = undefined;

    forkJoin({
      dealer: this.dealersApi.get(booking.dealerId).pipe(catchError(() => of(undefined))),
      vehicle: this.vehiclesApi.getById(booking.vehicleId).pipe(catchError(() => of(undefined))),
    }).subscribe({
      next: ({ dealer, vehicle }) => {
        this.selectedDealer = dealer;
        this.selectedVehicle = vehicle;
      }
    });
  }

  private hasAmountMismatch(orderAmountInPaise: number): boolean {
    const trustedAmountInPaise = this.lockedAmount > 0 ? Math.round(this.lockedAmount * 100) : 0;
    if (!trustedAmountInPaise || !orderAmountInPaise) {
      return false;
    }
    return trustedAmountInPaise !== orderAmountInPaise;
  }

  private buildAmountMismatchMessage(orderAmountInPaise: number): string {
    return `Razorpay will open with ${this.formatCurrency(orderAmountInPaise / 100)} for this checkout. Booking total remains ${this.formatCurrency(this.lockedAmount)}.`;
  }

  closeDemoCheckout() {
    this.demoCheckoutOpen = false;
    this.demoCheckoutMessage = '';
    this.demoOrder = undefined;
    this.toast.info('Payment cancelled.');
  }

  confirmDemoCheckout() {
    if (!this.demoOrder?.razorpayOrderId) {
      this.demoCheckoutOpen = false;
      this.toast.error('Invalid create-order response from server.');
      return;
    }

    const order = this.demoOrder;
    const orderId = order.razorpayOrderId;
    this.demoCheckoutOpen = false;
    this.processing = true;
    this.verifyPayment(this.buildMockSuccessPayload(orderId), orderId, order);
  }

  private buildCurrentCustomerOption(customerId: number): Customer {
    return {
      customerId,
      customerName: 'Current Customer',
      address: '-',
      email: this.auth.getEmail() || 'current@motomint.local',
      contactNumber: '',
    };
  }
}

