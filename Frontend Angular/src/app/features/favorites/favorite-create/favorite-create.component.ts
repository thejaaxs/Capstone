import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FavoritesApi } from '../../../api/favorites.service';
import { Favorite } from '../../../shared/models/favorite.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { CustomersApi } from '../../../api/customers.service';
import { Customer } from '../../../shared/models/customer.model';
import { DealersApi } from '../../../api/dealers.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './favorite-create.component.html',
  styleUrl: './favorite-create.component.css'
})
export class FavoriteCreateComponent {
  model: Favorite = {
    customerId: 0,
    dealerId: 1,
    dealerName: '',
    address: '',
    productName: '',
    reason: ''
  };
  customers: Customer[] = [];
  dealers: Dealer[] = [];
  loading = false;

  constructor(
    private api: FavoritesApi,
    private customersApi: CustomersApi,
    private dealersApi: DealersApi,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {
    const qp = this.route.snapshot.queryParamMap;
    const qpDealerId = Number(qp.get('dealerId'));
    if (!Number.isNaN(qpDealerId) && qpDealerId > 0) {
      this.model.dealerId = qpDealerId;
    }
    this.model.dealerName = qp.get('dealerName') || this.model.dealerName;
    this.model.productName = qp.get('productName') || this.model.productName;
    this.loadCustomers();
    this.loadDealers();
  }

  private loadCustomers() {
    this.customersApi.list().subscribe({
      next: (res) => {
        this.customers = res;
        const email = this.auth.getEmail();
        const matched = email ? this.customers.find((c) => c.email?.toLowerCase() === email.toLowerCase()) : undefined;
        if (matched?.customerId) {
          this.model.customerId = matched.customerId;
        } else if (this.customers[0]?.customerId) {
          this.model.customerId = this.customers[0].customerId;
        }
      },
      error: () => this.toast.error('Failed to load customers'),
    });
  }

  private loadDealers() {
    this.dealersApi.list().subscribe({
      next: (res) => {
        this.dealers = res;
        const match = this.dealers.find((d) => d.dealerId === this.model.dealerId);
        if (match?.dealerId) {
          this.selectDealer(match.dealerId);
        } else if (this.dealers[0]) {
          this.selectDealer(this.dealers[0].dealerId!);
        }
      },
      error: () => this.toast.error('Failed to load dealers'),
    });
  }

  selectDealer(dealerId: number) {
    const dealer = this.dealers.find((d) => d.dealerId === Number(dealerId));
    if (!dealer) return;
    this.model.dealerId = dealer.dealerId!;
    this.model.dealerName = dealer.dealerName;
    this.model.address = dealer.address;
  }

  submit() {
    this.loading = true;
    this.api.add(this.model).subscribe({
      next: () => {
        this.toast.success('Favorite created');
        this.router.navigateByUrl('/customer/favorites');
      },
      error: (err: HttpErrorResponse) => {
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(backendMessage || 'Favorite creation failed');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}

