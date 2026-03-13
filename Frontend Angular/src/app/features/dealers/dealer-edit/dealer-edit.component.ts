import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DealersApi } from '../../../api/dealers.service';
import { ToastService } from '../../../core/services/toast.service';
import { Dealer } from '../../../shared/models/dealer.model';

@Component({
  standalone: true,
  selector: 'app-dealer-edit',
  imports: [CommonModule, FormsModule],
  templateUrl: './dealer-edit.component.html',
  styleUrl: './dealer-edit.component.css'
})
export class DealerEditComponent {
  id!: number;
  loaded = false;
  saving = false;
  model: Partial<Dealer> = {};

  constructor(
    private api: DealersApi,
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
    this.api.update(this.id, this.model).subscribe({
      next: () => {
        this.toast.success('Dealer updated');
        this.router.navigateByUrl('/admin/dealers');
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(msg || 'Dealer update failed');
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

}


