import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomersApi } from '../../../api/customers.service';
import { ToastService } from '../../../core/services/toast.service';
import { Customer } from '../../../shared/models/customer.model';

@Component({
  standalone: true,
  selector: 'app-customer-edit',
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-edit.component.html',
  styleUrl: './customer-edit.component.css'
})
export class CustomerEditComponent {
  id!: number;
  loaded = false;
  saving = false;
  model: Partial<Customer> = {};

  constructor(
    private api: CustomersApi,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.get(this.id).subscribe((res) => {
      this.model = res;
      this.loaded = true;
    });
  }

  submit() {
    this.saving = true;
    this.api.update(this.id, this.model as Customer).subscribe({
      next: () => {
        this.toast.success('Customer updated');
        this.router.navigateByUrl('/admin/customers');
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(msg || 'Customer update failed');
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

}


