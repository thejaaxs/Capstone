import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BookingsApi } from '../../../api/bookings.service';
import { DealersApi } from '../../../api/dealers.service';
import { VehiclesApi } from '../../../api/vehicles.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-card dealer-dashboard">
      <div class="dashboard-header">
        <div>
          <p class="eyebrow">Dealer Console</p>
          <h2>Inventory and booking overview</h2>
          <p class="header-copy">Monitor inventory, respond to incoming requests, and keep deliveries on track.</p>
        </div>

        <div class="hero-badge">
          <span>Dealer ID</span>
          <strong>{{ dealerId || '--' }}</strong>
        </div>
      </div>

      <div class="state-card" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <div class="state-card error" *ngIf="!loading && errorMessage">
        <p>{{ errorMessage }}</p>
        <button type="button" class="btn btn-ghost" (click)="load()">Retry</button>
      </div>

      <div class="dashboard-body" *ngIf="!loading && !errorMessage">
        <section class="hero-panel">
          <div>
            <h3>Today’s snapshot</h3>
            <p>Use the quick actions below to update listings or review booking decisions without leaving the dashboard.</p>
          </div>

          <div class="hero-actions">
            <a routerLink="/dealer/vehicles"><button type="button" class="btn">Manage Vehicles</button></a>
            <a routerLink="/dealer/bookings"><button type="button" class="btn btn-ghost">View Bookings</button></a>
            <a routerLink="/dealer/vehicles/create"><button type="button" class="btn btn-secondary">Add Vehicle</button></a>
          </div>
        </section>

        <div class="stats-grid">
          <article class="stat-card">
            <small>Inventory</small>
            <strong>{{ totalVehicles }}</strong>
            <p>Total vehicles listed in your catalog.</p>
          </article>

          <article class="stat-card">
            <small>Bookings</small>
            <strong>{{ totalBookings }}</strong>
            <p>All booking records created for your dealership.</p>
          </article>

          <article class="stat-card highlight">
            <small>Awaiting Action</small>
            <strong>{{ pendingBookings }}</strong>
            <p>Requests still waiting for dealer approval.</p>
          </article>

          <article class="stat-card">
            <small>Confirmed</small>
            <strong>{{ confirmedBookings }}</strong>
            <p>Bookings confirmed after successful payment.</p>
          </article>
        </div>

        <div class="insight-grid">
          <article class="insight-card">
            <h3>Next priority</h3>
            <p *ngIf="pendingBookings > 0">Review pending booking requests to avoid delays in customer confirmation.</p>
            <p *ngIf="pendingBookings === 0">No pending approvals right now. Inventory and bookings are under control.</p>
          </article>

          <article class="insight-card">
            <h3>Catalog health</h3>
            <p *ngIf="totalVehicles > 0">Your current catalog is live. Keep price, availability, mileage, and ride type updated for better matching.</p>
            <p *ngIf="totalVehicles === 0">Add your first vehicle listing to start receiving booking requests.</p>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .dealer-dashboard {
      display: grid;
      gap: 1rem;
    }

    .dashboard-header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .eyebrow {
      margin: 0 0 0.2rem;
      font-size: 0.74rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--mm-primary-700);
    }

    .dashboard-header h2,
    .header-copy,
    .hero-panel h3,
    .hero-panel p,
    .stat-card p,
    .insight-card h3,
    .insight-card p {
      margin: 0;
    }

    .header-copy {
      margin-top: 0.35rem;
      color: var(--mm-text-muted);
      max-width: 720px;
    }

    .hero-badge {
      min-width: 140px;
      display: grid;
      gap: 0.15rem;
      padding: 0.85rem 1rem;
      border-radius: 16px;
      border: 1px solid var(--mm-border);
      background: var(--mm-surface-soft);
      box-shadow: var(--mm-shadow-sm);
    }

    .hero-badge span {
      color: var(--mm-text-muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .hero-badge strong {
      font-size: 1.45rem;
      color: var(--mm-text);
    }

    .dashboard-body {
      display: grid;
      gap: 1rem;
    }

    .hero-panel {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 1rem;
      border-radius: 18px;
      border: 1px solid var(--mm-border);
      background:
        radial-gradient(circle at top right, color-mix(in srgb, var(--mm-primary) 14%, transparent), transparent 42%),
        var(--mm-surface-soft);
    }

    .hero-panel p {
      margin-top: 0.35rem;
      color: var(--mm-text-muted);
      max-width: 640px;
    }

    .hero-actions {
      display: flex;
      gap: 0.55rem;
      flex-wrap: wrap;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 0.8rem;
    }

    .stat-card,
    .insight-card {
      display: grid;
      gap: 0.35rem;
      padding: 0.95rem;
      border-radius: 16px;
      border: 1px solid var(--mm-border);
      background: var(--mm-surface);
      box-shadow: var(--mm-shadow-sm);
    }

    .stat-card small {
      color: var(--mm-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .stat-card strong {
      font-size: 1.8rem;
      color: var(--mm-text);
      line-height: 1;
    }

    .stat-card p,
    .insight-card p {
      color: var(--mm-text-muted);
      font-size: 0.88rem;
      line-height: 1.5;
    }

    .stat-card.highlight {
      background: color-mix(in srgb, var(--mm-primary) 7%, var(--mm-surface));
      border-color: color-mix(in srgb, var(--mm-primary) 24%, var(--mm-border));
    }

    .insight-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 0.8rem;
    }

    @media (max-width: 720px) {
      .hero-actions {
        width: 100%;
      }

      .hero-actions .btn {
        flex: 1 1 100%;
      }
    }
  `]
})
export class DealerDashboardComponent implements OnInit {
  dealerId = 0;
  totalVehicles = 0;
  totalBookings = 0;
  pendingBookings = 0;
  confirmedBookings = 0;
  loading = false;
  errorMessage = '';

  constructor(
    private dealersApi: DealersApi,
    private vehiclesApi: VehiclesApi,
    private bookingsApi: BookingsApi,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    const email = this.auth.getEmail();
    if (!email) {
      this.errorMessage = 'Dealer session is missing.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.dealersApi.list().subscribe({
      next: (dealers) => {
        const dealer = dealers.find((d) => d.email?.toLowerCase() === email.toLowerCase());
        if (!dealer?.dealerId) {
          this.errorMessage = 'Dealer profile not found for logged-in user.';
          this.loading = false;
          return;
        }

        this.dealerId = dealer.dealerId;
        forkJoin({
          vehicles: this.vehiclesApi.listByDealer(this.dealerId),
          bookings: this.bookingsApi.byDealer(this.dealerId)
        }).subscribe({
          next: ({ vehicles, bookings }) => {
            this.totalVehicles = vehicles.length;
            this.totalBookings = bookings.length;
            this.pendingBookings = bookings.filter((b) => ['PENDING', 'REQUESTED'].includes((b.bookingStatus || '').toUpperCase())).length;
            this.confirmedBookings = bookings.filter((b) => (b.bookingStatus || '').toUpperCase() === 'CONFIRMED').length;
          },
          error: (err: HttpErrorResponse) => {
            const msg = typeof err.error === 'string' ? err.error : err.error?.message;
            this.errorMessage = msg || 'Failed to load dashboard metrics.';
          },
          complete: () => {
            this.loading = false;
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = msg || 'Failed to resolve dealer profile.';
        this.loading = false;
      }
    });
  }
}
