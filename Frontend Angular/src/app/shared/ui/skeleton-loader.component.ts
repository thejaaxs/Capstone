import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-skeleton-loader',
  imports: [CommonModule],
  template: `
    <div [ngClass]="containerClass">
      <div *ngFor="let _ of items" class="skeleton" [ngClass]="shapeClass"></div>
    </div>
  `,
  styles: [`
    .mm-skeleton-list {
      display: grid;
      gap: 0.5rem;
    }

    .mm-skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 0.85rem;
    }

    .mm-row {
      height: 14px;
      border-radius: 9px;
    }

    .mm-card {
      height: 220px;
      border-radius: 14px;
    }

    .mm-tile {
      height: 96px;
      border-radius: 12px;
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() count = 4;
  @Input() variant: 'row' | 'card' | 'tile' = 'row';
  @Input() grid = false;

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }

  get containerClass(): string {
    return this.grid ? 'mm-skeleton-grid' : 'mm-skeleton-list';
  }

  get shapeClass(): string {
    if (this.variant === 'card') return 'mm-card';
    if (this.variant === 'tile') return 'mm-tile';
    return 'mm-row';
  }
}
