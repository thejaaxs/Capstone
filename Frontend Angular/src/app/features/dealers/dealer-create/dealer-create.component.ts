import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DealersApi } from '../../../api/dealers.service';
import { ToastService } from '../../../core/services/toast.service';
import { Dealer } from '../../../shared/models/dealer.model';

@Component({
  standalone: true,
  selector: 'app-dealer-create',
  imports: [FormsModule],
  templateUrl: './dealer-create.component.html',
  styleUrl: './dealer-create.component.css'
})
export class DealerCreateComponent {
  model: Dealer = {
    dealerName: '',
    address: '',
    contactNumber: '',
    email: ''
  };
  saving = false;

  constructor(private api: DealersApi, private router: Router, private toast: ToastService) {}

  submit() {
    this.saving = true;
    this.api.add(this.model).subscribe({
      next: () => {
        this.toast.success('Dealer created');
        this.router.navigateByUrl('/admin/dealers');
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(msg || 'Dealer creation failed');
      },
      complete: () => {
        this.saving = false;
      }
    });
  }
}

