import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeliverySchedule } from '../shared/models/delivery.model';

@Injectable({ providedIn: 'root' })
export class DeliveriesApi {
  private readonly base = `${environment.apiUrl}/deliveries`;

  constructor(private http: HttpClient) {}

  create(payload: DeliverySchedule): Observable<DeliverySchedule> {
    return this.http.post<DeliverySchedule>(this.base, payload);
  }

  byCustomer(customerId: number): Observable<DeliverySchedule[]> {
    return this.http.get<DeliverySchedule[]>(`${this.base}/customer/${customerId}`);
  }

  byDealer(dealerId: number): Observable<DeliverySchedule[]> {
    return this.http.get<DeliverySchedule[]>(`${this.base}/dealer/${dealerId}`);
  }

  update(id: number, payload: Partial<DeliverySchedule>): Observable<DeliverySchedule> {
    return this.http.put<DeliverySchedule>(`${this.base}/${id}`, payload);
  }
}
