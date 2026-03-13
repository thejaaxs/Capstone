import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DealersApi } from '../../../api/dealers.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-dealers-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './dealers-list.component.html',
  styleUrl: './dealers-list.component.css'
})
export class DealersListComponent {
  list: Dealer[] = [];
  loading = false;
  errorMessage = '';

  constructor(private api: DealersApi, private toast: ToastService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.errorMessage = '';
    this.api.list().subscribe({
      next: (res) => (this.list = res),
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = msg || 'Could not load dealers.';
      },
      complete: () => (this.loading = false),
    });
  }

  del(id: number) {
    if (!confirm(`Delete dealer #${id}?`)) return;
    this.api.delete(id).subscribe({
      next: () => {
        this.toast.success('Dealer deleted');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(msg || 'Failed to delete dealer');
      }
    });
  }

}


