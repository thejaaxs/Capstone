import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ReviewsApi } from '../../../api/reviews.service';
import { Review } from '../../../shared/models/review.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell workflow-page">
      <section class="panel">
        <div class="section-header">
          <div><h2>Customer Reviews</h2><p class="section-subtitle">Dealer-facing feedback stream for follow-up and reputation management.</p></div>
        </div>
        <div class="review-feed">
          <article class="review-card" *ngFor="let review of reviews()">
            <div class="review-head">
              <strong>{{ review.title || 'Vehicle review' }}</strong>
              <span>{{ review.rating }}/5</span>
            </div>
            <p>{{ review.comment || 'No comment provided.' }}</p>
          </article>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .review-feed { display: grid; gap: 0.8rem; }
    .review-card { border: 1px solid var(--mm-border); border-radius: 16px; padding: 1rem; background: var(--mm-surface); }
    .review-head { display: flex; justify-content: space-between; gap: 0.75rem; }
  `]
})
export class DealerCustomerReviewsComponent {
  readonly reviews = signal<Review[]>([]);

  constructor(private reviewsApi: ReviewsApi) {
    this.reviewsApi.adminAll().subscribe((reviews) => this.reviews.set(reviews));
  }
}
