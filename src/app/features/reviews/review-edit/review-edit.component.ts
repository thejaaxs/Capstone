import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewsApi } from '../../../api/reviews.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { Review } from '../../../shared/models/review.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './review-edit.component.css',
  template: `
    <section class="page-card page-shell">
      <article class="card">
        <h2>Edit Review</h2>
        <div class="state-card" *ngIf="!loaded">
          <div class="spinner"></div>
          <p>Loading review...</p>
        </div>

        <form *ngIf="loaded" (ngSubmit)="submit()" #f="ngForm">
          <p class="section-subtitle">Review ID: <b>{{ id }}</b></p>

          <label>Product Name</label>
          <input [(ngModel)]="model.productName" name="productName" />

          <label>Rating</label>
          <div class="rating-field">
            <input class="rating-input" type="number" [(ngModel)]="model.rating" name="rating" #ratingCtrl="ngModel" min="1" max="5" step="1" />
            <small>1-5</small>
          </div>
          <small class="field-error" *ngIf="ratingCtrl.invalid && (ratingCtrl.touched || f.submitted)">
            Rating must be between 1 and 5.
          </small>

          <label>Title</label>
          <input [(ngModel)]="model.title" name="title" />

          <label>Comment</label>
          <textarea [(ngModel)]="model.comment" name="comment"></textarea>

          <button class="btn" type="submit" [disabled]="saving || !isValidRatingValue(model.rating)">{{ saving ? 'Updating...' : 'Update' }}</button>
        </form>
      </article>
    </section>
  `
})
export class ReviewEditComponent implements OnInit {
  id!: number;
  model: Partial<Review> = {};
  loaded = false;
  saving = false;

  constructor(private api: ReviewsApi, private route: ActivatedRoute, private router: Router, private toast: ToastService) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.id || Number.isNaN(this.id)) {
      this.toast.error('Invalid review id.');
      this.router.navigateByUrl('/customer/reviews');
      return;
    }
    this.api.list().subscribe({
      next: (all) => {
        const r = all.find(x => x.id === this.id);
        if (!r) {
          this.toast.error('Review not found or already deleted.');
          this.router.navigateByUrl('/customer/reviews');
          return;
        }
        this.model = { productName: r.productName, rating: r.rating, title: r.title, comment: r.comment };
        this.loaded = true;
      },
      error: (err: HttpErrorResponse) => {
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(backendMessage || 'Failed to load review');
        this.router.navigateByUrl('/customer/reviews');
      },
    });
  }

  submit() {
    const rating = this.normalizeRating(this.model.rating);
    if (rating === null) {
      this.toast.error('Rating must be between 1 and 5.');
      return;
    }
    const payload: Partial<Review> = {
      ...this.model,
      rating,
      productName: this.model.productName?.trim(),
      title: this.model.title?.trim(),
      comment: this.model.comment?.trim(),
    };

    this.saving = true;
    this.api.update(this.id, payload).subscribe({
      next: () => {
        this.toast.success('Updated');
        this.router.navigateByUrl('/customer/reviews');
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.toast.error('Review not found. It may have been removed.');
          this.router.navigateByUrl('/customer/reviews');
          return;
        }
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(this.getFriendlyReviewError(backendMessage));
      },
      complete: () => {
        this.saving = false;
      },
    });
  }

  isValidRatingValue(value: unknown): boolean {
    return this.normalizeRating(value) !== null;
  }

  private normalizeRating(value: unknown): number | null {
    const rating = Number(value);
    if (!Number.isFinite(rating)) return null;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
    return rating;
  }

  private getFriendlyReviewError(message?: string): string {
    const normalized = (message || '').toLowerCase();
    if (normalized.includes('rating')) {
      return 'Rating must be between 1 and 5.';
    }
    return message || 'Update failed';
  }
}

