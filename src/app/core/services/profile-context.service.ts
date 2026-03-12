import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, shareReplay, tap } from 'rxjs';
import { CustomersApi } from '../../api/customers.service';
import { DealersApi } from '../../api/dealers.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProfileContextService {
  private customerId$?: Observable<number | null>;
  private dealerId$?: Observable<number | null>;

  constructor(
    private auth: AuthService,
    private customersApi: CustomersApi,
    private dealersApi: DealersApi
  ) {}

  getCustomerId(): Observable<number | null> {
    const cached = this.auth.getCustomerId();
    if (cached) {
      return of(cached);
    }

    if (!this.customerId$) {
      const email = (this.auth.getEmail() || '').toLowerCase();
      this.customerId$ = this.customersApi.list().pipe(
        map((customers) => customers.find((customer) => customer.email?.toLowerCase() === email)?.customerId ?? null),
        tap((id) => {
          if (id) {
            this.auth.setCustomerId(id);
          }
        }),
        shareReplay(1)
      );
    }

    return this.customerId$;
  }

  getDealerId(): Observable<number | null> {
    const cached = this.auth.getDealerId();
    if (cached) {
      return of(cached);
    }

    if (!this.dealerId$) {
      const email = (this.auth.getEmail() || '').toLowerCase();
      this.dealerId$ = this.dealersApi.list().pipe(
        map((dealers) => dealers.find((dealer) => dealer.email?.toLowerCase() === email)?.dealerId ?? null),
        tap((id) => {
          if (id) {
            this.auth.setDealerId(id);
          }
        }),
        shareReplay(1)
      );
    }

    return this.dealerId$;
  }

  getIds(): Observable<{ customerId: number | null; dealerId: number | null }> {
    return forkJoin({
      customerId: this.getCustomerId(),
      dealerId: this.getDealerId()
    });
  }
}
