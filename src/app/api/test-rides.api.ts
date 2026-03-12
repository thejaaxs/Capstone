import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TestRideBooking, TestRideDecision, TestRideSlot } from '../shared/models/test-ride.model';

@Injectable({ providedIn: 'root' })
export class TestRidesApi {
  private readonly base = `${environment.apiUrl}/test-rides`;

  constructor(private http: HttpClient) {}

  listSlots(dealerId: number, date: string): Observable<TestRideSlot[]> {
    const params = new HttpParams().set('dealerId', dealerId).set('date', date);
    return this.http.get<TestRideSlot[]>(`${this.base}/slots`, { params });
  }

  create(payload: TestRideBooking): Observable<TestRideBooking> {
    return this.http.post<TestRideBooking>(this.base, payload);
  }

  byCustomer(customerId: number): Observable<TestRideBooking[]> {
    return this.http.get<TestRideBooking[]>(`${this.base}/customer/${customerId}`);
  }

  byDealer(dealerId: number): Observable<TestRideBooking[]> {
    return this.http.get<TestRideBooking[]>(`${this.base}/dealer/${dealerId}`);
  }

  updateStatus(id: number, payload: TestRideDecision): Observable<TestRideBooking> {
    return this.http.put<TestRideBooking>(`${this.base}/${id}/status`, payload);
  }
}
