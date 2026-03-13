import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingsApi } from '../../../api/bookings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { BookingCreateRequest } from '../../../shared/models/booking.model';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomersApi } from '../../../api/customers.service';
import { Customer } from '../../../shared/models/customer.model';
import { AuthService } from '../../../core/services/auth.service';
import { DealersApi } from '../../../api/dealers.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { VehiclesApi } from '../../../api/vehicles.service';
import { Vehicle } from '../../../shared/models/vehicle.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-create.component.html',
  styleUrl: './booking-create.component.css'
})
export class BookingCreateComponent {
  model: BookingCreateRequest = { customerId: 0, dealerId: 0, vehicleId: 0, amount: 0 };
  loading = false;
  customers: Customer[] = [];
  dealers: Dealer[] = [];
  vehicles: Vehicle[] = [];
  selectedDealer?: Dealer;
  selectedVehicle?: Vehicle;
  requestedProductName = '';
  private requestedVehicleId = 0;

  constructor(
    private api: BookingsApi,
    private customersApi: CustomersApi,
    private dealersApi: DealersApi,
    private vehiclesApi: VehiclesApi,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {
    const query = this.route.snapshot.queryParamMap;
    const dealerId = Number(query.get('dealerId'));
    const vehicleId = Number(query.get('vehicleId'));
    const amount = Number(query.get('amount'));

    if (dealerId > 0) this.model.dealerId = dealerId;
    if (vehicleId > 0) {
      this.model.vehicleId = vehicleId;
      this.requestedVehicleId = vehicleId;
    }
    this.requestedProductName = (query.get('productName') || '').trim();
    if (amount > 0) this.model.amount = amount;

    this.loadCustomers();
    this.loadDealers();
  }

  private loadCustomers() {
    this.customersApi.list().subscribe({
      next: (res) => {
        this.customers = res;
        const email = this.auth.getEmail();
        const matched = email ? this.customers.find((c) => c.email?.toLowerCase() === email.toLowerCase()) : undefined;
        if (matched?.customerId) {
          this.model.customerId = matched.customerId;
        } else if (this.customers[0]?.customerId) {
          this.model.customerId = this.customers[0].customerId;
        }
      },
      error: () => {
        this.toast.error('Failed to load customers. Enter Customer ID manually.');
      }
    });
  }

  private loadDealers() {
    this.dealersApi.list().subscribe({
      next: (res) => {
        this.dealers = res;
        const email = this.auth.getEmail();
        const matched = email ? this.dealers.find((d) => d.email?.toLowerCase() === email.toLowerCase()) : undefined;
        if (this.model.dealerId > 0) {
          const byId = this.dealers.find((d) => d.dealerId === this.model.dealerId);
          if (!byId?.dealerId) {
            this.model.dealerId = 0;
          }
        }

        if (this.model.dealerId > 0) {
          this.loadVehiclesByDealer();
          return;
        }

        if (matched?.dealerId) {
          this.model.dealerId = matched.dealerId;
        } else if (this.dealers[0]?.dealerId) {
          this.model.dealerId = this.dealers[0].dealerId;
        }
        this.loadVehiclesByDealer();
      },
      error: () => {
        this.toast.error('Failed to load dealers. Enter Dealer ID manually.');
      }
    });
  }

  onDealerChange() {
    this.selectedDealer = this.dealers.find((dealer) => dealer.dealerId === Number(this.model.dealerId));
    this.selectedVehicle = undefined;
    this.model.vehicleId = 0;
    this.model.amount = 0;
    this.loadVehiclesByDealer();
  }

  private loadVehiclesByDealer() {
    if (!this.model.dealerId) return;
    this.selectedDealer = this.dealers.find((dealer) => dealer.dealerId === Number(this.model.dealerId));
    this.vehiclesApi.listByDealer(this.model.dealerId).subscribe({
      next: (res) => {
        this.vehicles = res;
        if (this.requestedVehicleId > 0) {
          const requested = this.vehicles.find((v) => v.id === this.requestedVehicleId);
          if (requested?.id) {
            this.selectVehicle(requested.id);
            return;
          }
        }
        if (this.requestedProductName) {
          const requestedByName = this.vehicles.find((v) => this.matchesRequestedProduct(v));
          if (requestedByName?.id) {
            this.selectVehicle(requestedByName.id);
            return;
          }
        }
        if (this.model.vehicleId > 0) {
          const current = this.vehicles.find((v) => v.id === this.model.vehicleId);
          if (current?.id) {
            this.selectVehicle(current.id);
            return;
          }
        }
        if (this.vehicles[0]?.id) {
          this.selectVehicle(this.vehicles[0].id);
        } else {
          this.selectedVehicle = undefined;
          this.model.vehicleId = 0;
          this.model.amount = 0;
        }
      },
      error: () => {
        this.vehicles = [];
        this.selectedVehicle = undefined;
        this.toast.error('Failed to load vehicles for selected dealer.');
        if (this.model.vehicleId > 0) {
          this.loadVehicleById(this.model.vehicleId);
        }
      }
    });
  }

  selectVehicle(vehicleId: number) {
    const selected = this.vehicles.find((v) => v.id === Number(vehicleId));
    if (!selected?.id) {
      if (Number(vehicleId) > 0) {
        this.loadVehicleById(Number(vehicleId));
      }
      return;
    }
    this.selectedVehicle = selected;
    this.model.vehicleId = selected.id;
    this.model.dealerId = selected.dealerId;
    this.model.amount = this.lockedAmount;
  }

  submit() {
    const payload = this.buildCreatePayload();
    if (!payload) {
      return;
    }

    this.loading = true;
    this.api.create(payload).subscribe({
      next: () => {
        this.toast.success('Booking created');
        this.router.navigateByUrl('/customer/bookings');
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Booking creation failed. Please verify customer, dealer and vehicle IDs.';
        this.toast.error(msg);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  get lockedAmount(): number {
    return Number(this.selectedVehicle?.price || 0);
  }

  get hasLockedAmount(): boolean {
    return this.lockedAmount > 0;
  }

  get selectedVehicleLabel(): string {
    if (!this.selectedVehicle) return 'Select a bike to continue.';
    return `${this.selectedVehicle.brand} ${this.selectedVehicle.name}`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  private buildCreatePayload(): BookingCreateRequest | null {
    if (!this.model.customerId || this.model.customerId <= 0) {
      this.toast.error('Please select a valid customer.');
      return null;
    }
    if (!this.model.dealerId || this.model.dealerId <= 0) {
      this.toast.error('Please select a valid dealer.');
      return null;
    }
    if (!this.model.vehicleId || this.model.vehicleId <= 0 || !this.selectedVehicle?.id) {
      this.toast.error('Please select a valid bike.');
      return null;
    }
    if (!this.hasLockedAmount) {
      this.toast.error('Booking amount could not be resolved from the selected bike.');
      return null;
    }

    return {
      ...this.model,
      dealerId: this.selectedVehicle.dealerId,
      vehicleId: this.selectedVehicle.id,
      amount: this.lockedAmount,
    };
  }

  private loadVehicleById(vehicleId: number) {
    if (!vehicleId || Number.isNaN(vehicleId)) return;
    this.vehiclesApi.getById(vehicleId).subscribe({
      next: (vehicle) => {
        this.selectedVehicle = vehicle;
        this.model.vehicleId = vehicle.id || vehicleId;
        this.model.dealerId = vehicle.dealerId;
        this.model.amount = vehicle.price;
        const knownDealer = this.dealers.find((dealer) => dealer.dealerId === vehicle.dealerId);
        if (knownDealer) {
          this.selectedDealer = knownDealer;
        }
      },
      error: () => {
        this.selectedVehicle = undefined;
        this.model.amount = 0;
      }
    });
  }

  private matchesRequestedProduct(vehicle: Vehicle): boolean {
    return !!this.requestedProductName && vehicle.name.trim().toLowerCase() === this.requestedProductName.toLowerCase();
  }
}

