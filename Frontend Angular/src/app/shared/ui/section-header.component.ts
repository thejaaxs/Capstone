import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-section-header',
  imports: [CommonModule],
  template: `
    <div class="section-header mm-section-header">
      <div>
        <h2>{{ title }}</h2>
        <p class="section-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div class="right-slot" *ngIf="actionLabel">
        <a *ngIf="actionLink" [href]="actionLink" class="btn btn-ghost">{{ actionLabel }}</a>
        <button *ngIf="!actionLink" type="button" class="btn btn-ghost">{{ actionLabel }}</button>
      </div>
    </div>
  `,
  styles: [`
    .mm-section-header {
      margin-bottom: 0.8rem;
    }

    .right-slot {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
    }

    h2 {
      margin: 0;
    }
  `]
})
export class SectionHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() actionLabel = '';
  @Input() actionLink = '';
}
