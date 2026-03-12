import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DealersApi } from '../../../api/dealers.service';
import { ReviewsApi } from '../../../api/reviews.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { Review } from '../../../shared/models/review.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-shell dealer-selection-page">
      <section class="panel">
        <div class="section-header">
          <div>
            <h2>Dealer Selection</h2>
            <p class="section-subtitle">Choose a nearby dealer for test ride, booking, and delivery.</p>
          </div>
          <a routerLink="/customer/vehicles" class="btn btn-ghost">Back to Vehicles</a>
        </div>

        <div class="state-card" *ngIf="loading()"> <div class="spinner"></div> <p>Loading dealers...</p> </div>

        <div class="dealer-grid" *ngIf="!loading()">
          <article class="dealer-card" *ngFor="let dealer of dealers()">
            <div>
              <h3>{{ dealer.dealerName }}</h3>
              <p>{{ dealer.city || 'City not set' }}</p>
            </div>
            <div class="dealer-meta">
              <span>{{ dealer.address }}</span>
              <span>{{ dealer.contactNumber || 'Contact unavailable' }}</span>
              <span>Rating {{ dealer.rating || 4.5 }}/5</span>
              <span>Vehicles {{ dealer.availableVehicles || 0 }}</span>
              <span>Test rides {{ dealer.testRideAvailable === false ? 'Paused' : 'Available' }}</span>
            </div>
            <div class="review-strip">
              <strong>Recent reviews</strong>
              <p *ngFor="let review of reviewsForDealer(dealer.dealerName) | slice:0:2">{{ review.comment || review.title }}</p>
            </div>
            <div class="card-actions">
              <button class="btn btn-ghost" type="button" (click)="favoriteDealer(dealer)">Add Favorite</button>
              <button class="btn btn-ghost" type="button" (click)="bookTestRide(dealer)">Book Test Ride</button>
              <button class="btn" type="button" (click)="continueBooking(dealer)">Continue Booking</button>
            </div>
          </article>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .dealer-selection-page { padding: 1rem; }
    .dealer-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .dealer-card { border: 1px solid var(--mm-border); border-radius: 16px; background: var(--mm-surface); padding: 1rem; display: grid; gap: 0.8rem; }
    .dealer-meta { display: grid; gap: 0.28rem; font-size: 0.88rem; color: var(--mm-text-muted); }
    .review-strip { border-top: 1px dashed var(--mm-border); padding-top: 0.75rem; display: grid; gap: 0.3rem; }
    .review-strip p { margin: 0; }
    .card-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    @media (max-width: 768px) { .dealer-grid { grid-template-columns: 1fr; } .dealer-selection-page { padding: 0.75rem; } }
  `]
})
export class DealerSelectionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dealersApi = inject(DealersApi);
  private readonly reviewsApi = inject(ReviewsApi);

  readonly loading = signal(true);
  readonly dealers = signal<Dealer[]>([]);
  readonly reviews = signal<Review[]>([]);

  private readonly vehicleId = Number(this.route.snapshot.queryParamMap.get('vehicleId') || 0);

  constructor() {
    this.dealersApi.list().subscribe({
      next: (dealers) => {
        this.dealers.set(dealers.map((dealer) => ({
          ...dealer,
          city: dealer.city || this.cityFromAddress(dealer.address),
          rating: dealer.rating || 4.4,
          availableVehicles: dealer.availableVehicles || 12,
          testRideAvailable: dealer.testRideAvailable ?? true
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.reviewsApi.adminAll().subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: () => this.reviews.set([])
    });
  }

  reviewsForDealer(name: string): Review[] {
    return this.reviews().filter((review) => (review.comment || review.title || '').toLowerCase().includes(name.toLowerCase()));
  }

  favoriteDealer(dealer: Dealer): void {
    this.router.navigate(['/customer/favorites/create'], {
      queryParams: {
        dealerId: dealer.dealerId,
        dealerName: dealer.dealerName,
        productName: this.route.snapshot.queryParamMap.get('model') || 'Dealer shortlist'
      }
    });
  }

  bookTestRide(dealer: Dealer): void {
    this.router.navigate(['/customer/test-ride'], {
      queryParams: { dealerId: dealer.dealerId, vehicleId: this.vehicleId }
    });
  }

  continueBooking(dealer: Dealer): void {
    this.router.navigate(['/customer/booking'], {
      queryParams: { dealerId: dealer.dealerId, vehicleId: this.vehicleId }
    });
  }

  private cityFromAddress(address: string): string {
    return address?.split(',').at(-1)?.trim() || 'Bengaluru';
  }
}
