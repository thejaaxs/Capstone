import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomersApi } from '../../../api/customers.service';
import { ToastService } from '../../../core/services/toast.service';
import { Customer } from '../../../shared/models/customer.model';

@Component({
  standalone: true,
  selector: 'app-customer-create',
  imports: [FormsModule],
  templateUrl: './customer-create.component.html',
  styleUrl: './customer-create.component.css'
})
export class CustomerCreateComponent {
  model: Customer = { customerName: '', address: '', email: '', contactNumber: '' };
  saving = false;

  constructor(private api: CustomersApi, private router: Router, private toast: ToastService) {}

  submit() {
    this.saving = true;
    this.api.add(this.model).subscribe({
      next: () => {
        this.toast.success('Customer created');
        this.router.navigateByUrl('/admin/customers');
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(msg || 'Customer creation failed');
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

}


