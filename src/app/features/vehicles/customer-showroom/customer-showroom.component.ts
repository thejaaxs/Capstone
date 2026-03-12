import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { DealersApi } from '../../../api/dealers.service';
import { VehiclesApi } from '../../../api/vehicles.service';
import { PricingService } from '../../../core/services/pricing.service';
import { ToastService } from '../../../core/services/toast.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { Vehicle } from '../../../shared/models/vehicle.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-shell showroom-page">
      <section class="hero-banner">
        <div class="hero-inner">
          <span class="hero-chip">Customer Purchase Flow</span>
          <h1>Browse scooters and bikes with dealer-ready pricing.</h1>
          <p>Compare ex-showroom and on-road prices, shortlist dealers, and move into test ride or booking in one flow.</p>
        </div>
      </section>

      <section class="panel">
        <div class="section-header">
          <div>
            <h2>Vehicle Listing</h2>
            <p class="section-subtitle">Filter by brand, price, mileage, and engine capacity.</p>
          </div>
          <a routerLink="/customer/favorites" class="btn btn-ghost">Favorites</a>
        </div>

        <div class="showroom-filters">
          <label>
            Brand
            <select [(ngModel)]="brandFilter">
              <option value="">All brands</option>
              <option *ngFor="let brand of brands()" [value]="brand">{{ brand }}</option>
            </select>
          </label>
          <label>
            Max Price
            <input type="number" [(ngModel)]="maxPrice" placeholder="200000" />
          </label>
          <label>
            Min Mileage
            <input type="number" [(ngModel)]="minMileage" placeholder="40" />
          </label>
          <label>
            Min Engine CC
            <input type="number" [(ngModel)]="minEngineCc" placeholder="110" />
          </label>
        </div>

        <div class="state-card" *ngIf="loading()"> <div class="spinner"></div> <p>Loading vehicles...</p> </div>
        <div class="state-card error" *ngIf="error()"> <p>{{ error() }}</p> </div>

        <div class="vehicle-grid" *ngIf="!loading() && !error()">
          <article class="catalog-card" *ngFor="let vehicle of filteredVehicles()">
            <img [src]="vehicle.imageUrl || placeholder" [alt]="vehicle.name" />
            <div class="catalog-content">
              <div class="catalog-head">
                <div>
                  <h3>{{ vehicle.name }}</h3>
                  <p>{{ vehicle.brand }} <span *ngIf="vehicle.city">| {{ vehicle.city }}</span></p>
                </div>
                <label class="compare-tick">
                  <input type="checkbox" [checked]="isCompared(vehicle.id)" (change)="toggleCompare(vehicle)" />
                  Compare
                </label>
              </div>

              <div class="price-stack">
                <strong>Ex-showroom: {{ price(vehicle).exShowroomPrice | currency:'INR':'symbol':'1.0-0' }}</strong>
                <span>On-road est.: {{ price(vehicle).totalOnRoadPrice | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>

              <div class="spec-grid">
                <span>Mileage: {{ vehicle.mileage || 0 }} km/l</span>
                <span>Engine: {{ vehicle.engineCc || 0 }} cc</span>
                <span>Fuel: {{ vehicle.fuelType || 'PETROL' }}</span>
                <span>Booking: {{ vehicle.bookingAvailable === false ? 'Closed' : 'Open' }}</span>
              </div>

              <div class="card-actions">
                <a class="btn btn-ghost" [routerLink]="['/customer/vehicles', vehicle.id]">Details</a>
                <button class="btn btn-ghost" type="button" (click)="openDealerSelection(vehicle)">Choose Dealer</button>
                <button class="btn" type="button" (click)="openBooking(vehicle)">Book</button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="panel" *ngIf="comparedVehicles().length">
        <div class="section-header">
          <div>
            <h2>Vehicle Comparison</h2>
            <p class="section-subtitle">Up to 3 vehicles side by side.</p>
          </div>
          <button class="btn btn-ghost" type="button" (click)="clearCompare()">Clear</button>
        </div>

        <div class="compare-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th *ngFor="let vehicle of comparedVehicles()">{{ vehicle.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Brand</td><td *ngFor="let vehicle of comparedVehicles()">{{ vehicle.brand }}</td></tr>
              <tr><td>Ex-showroom</td><td *ngFor="let vehicle of comparedVehicles()">{{ price(vehicle).exShowroomPrice | currency:'INR':'symbol':'1.0-0' }}</td></tr>
              <tr><td>On-road</td><td *ngFor="let vehicle of comparedVehicles()">{{ price(vehicle).totalOnRoadPrice | currency:'INR':'symbol':'1.0-0' }}</td></tr>
              <tr><td>Mileage</td><td *ngFor="let vehicle of comparedVehicles()">{{ vehicle.mileage || 0 }} km/l</td></tr>
              <tr><td>Engine</td><td *ngFor="let vehicle of comparedVehicles()">{{ vehicle.engineCc || 0 }} cc</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .showroom-page { padding: 1rem; }
    .hero-chip { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.82); }
    .showroom-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.8rem; margin-bottom: 1rem; }
    .showroom-filters label { display: grid; gap: 0.35rem; }
    .vehicle-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .catalog-card { overflow: hidden; border: 1px solid var(--mm-border); border-radius: 18px; background: var(--mm-surface); box-shadow: var(--mm-shadow-sm); display: grid; }
    .catalog-card img { width: 100%; height: 220px; object-fit: contain; background: color-mix(in srgb, var(--mm-primary-100) 56%, var(--mm-surface)); padding: 1rem; }
    .catalog-content { padding: 1rem; display: grid; gap: 0.8rem; }
    .catalog-head { display: flex; justify-content: space-between; gap: 0.75rem; align-items: flex-start; }
    .catalog-head p { margin: 0.2rem 0 0; }
    .compare-tick { display: inline-flex; gap: 0.4rem; align-items: center; font-size: 0.8rem; }
    .compare-tick input { width: auto; }
    .price-stack { display: grid; gap: 0.2rem; }
    .price-stack strong, .price-stack span { color: var(--mm-text); }
    .spec-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.55rem; font-size: 0.84rem; color: var(--mm-text-muted); }
    .card-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .compare-table-wrap { overflow: auto; }
    @media (max-width: 980px) { .showroom-filters, .vehicle-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .showroom-filters, .vehicle-grid, .spec-grid { grid-template-columns: 1fr; } .showroom-page { padding: 0.75rem; } }
  `]
})
export class CustomerShowroomComponent {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly vehicles = signal<Vehicle[]>([]);
  readonly dealers = signal<Dealer[]>([]);
  readonly compareIds = signal<number[]>([]);
  readonly brands = computed(() => [...new Set(this.vehicles().map((vehicle) => vehicle.brand).filter(Boolean))].sort());

  brandFilter = '';
  maxPrice?: number;
  minMileage?: number;
  minEngineCc?: number;
  placeholder = 'https://placehold.co/800x450/e6edf8/1e3a5f?text=Dealer+Bike';

  readonly filteredVehicles = computed(() => this.vehicles().filter((vehicle) => {
    const breakdown = this.price(vehicle);
    return (!this.brandFilter || vehicle.brand === this.brandFilter)
      && (!this.maxPrice || breakdown.totalOnRoadPrice <= this.maxPrice)
      && (!this.minMileage || (vehicle.mileage || 0) >= this.minMileage)
      && (!this.minEngineCc || (vehicle.engineCc || 0) >= this.minEngineCc);
  }));

  readonly comparedVehicles = computed(() => this.vehicles().filter((vehicle) => !!vehicle.id && this.compareIds().includes(vehicle.id)));

  constructor(
    private vehiclesApi: VehiclesApi,
    private dealersApi: DealersApi,
    private pricing: PricingService,
    private router: Router,
    private toast: ToastService
  ) {
    combineLatest([this.vehiclesApi.listAll(), this.dealersApi.list()]).pipe(map(([vehicles, dealers]) => ({ vehicles, dealers }))).subscribe({
      next: ({ vehicles, dealers }) => {
        this.vehicles.set(vehicles.map((vehicle) => ({
          ...vehicle,
          exShowroomPrice: vehicle.exShowroomPrice ?? vehicle.price,
          bookingAvailable: vehicle.bookingAvailable ?? true
        })));
        this.dealers.set(dealers);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load showroom inventory.');
        this.loading.set(false);
      }
    });
  }

  price(vehicle: Vehicle) {
    return this.pricing.calculateBreakdown({
      exShowroomPrice: vehicle.exShowroomPrice ?? vehicle.price,
      insurance: vehicle.insuranceAmount,
      handlingCharges: vehicle.handlingCharges,
      accessories: vehicle.accessoriesCost
    });
  }

  toggleCompare(vehicle: Vehicle): void {
    if (!vehicle.id) return;
    const current = this.compareIds();
    if (current.includes(vehicle.id)) {
      this.compareIds.set(current.filter((id) => id !== vehicle.id));
      return;
    }
    if (current.length >= 3) {
      this.toast.info('Compare supports up to 3 vehicles.');
      return;
    }
    this.compareIds.set([...current, vehicle.id]);
  }

  isCompared(vehicleId?: number): boolean {
    return !!vehicleId && this.compareIds().includes(vehicleId);
  }

  clearCompare(): void {
    this.compareIds.set([]);
  }

  openDealerSelection(vehicle: Vehicle): void {
    this.router.navigate(['/customer/dealers'], {
      queryParams: { vehicleId: vehicle.id, brand: vehicle.brand, model: vehicle.name }
    });
  }

  openBooking(vehicle: Vehicle): void {
    this.router.navigate(['/customer/booking'], {
      queryParams: { vehicleId: vehicle.id, dealerId: vehicle.dealerId }
    });
  }
}
