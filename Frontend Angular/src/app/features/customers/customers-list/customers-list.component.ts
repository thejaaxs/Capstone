import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CustomersApi } from '../../../api/customers.service';
import { Customer } from '../../../shared/models/customer.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-customers-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './customers-list.component.html',
  styleUrl: './customers-list.component.css'
})
export class CustomersListComponent {
  list: Customer[] = [];
  loading = false;
  errorMessage = '';

  constructor(private api: CustomersApi, private toast: ToastService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.errorMessage = '';
    this.api.list().subscribe({
      next: (res) => {
        this.list = res;
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = msg || 'Could not load customers.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  del(id: number) {
    if (!confirm(`Delete customer #${id}?`)) return;
    this.api.delete(id).subscribe({
      next: () => {
        this.toast.success('Customer deleted');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(msg || 'Failed to delete customer');
      }
    });
  }

}


