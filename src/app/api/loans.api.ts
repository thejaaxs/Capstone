import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoanApplication } from '../shared/models/loan.model';

@Injectable({ providedIn: 'root' })
export class LoansApi {
  private readonly base = `${environment.apiUrl}/loans`;

  constructor(private http: HttpClient) {}

  create(payload: LoanApplication): Observable<LoanApplication> {
    return this.http.post<LoanApplication>(this.base, payload);
  }

  byCustomer(customerId: number): Observable<LoanApplication[]> {
    return this.http.get<LoanApplication[]>(`${this.base}/customer/${customerId}`);
  }

  byDealer(dealerId: number): Observable<LoanApplication[]> {
    return this.http.get<LoanApplication[]>(`${this.base}/dealer/${dealerId}`);
  }

  updateStatus(id: number, payload: Partial<LoanApplication>): Observable<LoanApplication> {
    return this.http.put<LoanApplication>(`${this.base}/${id}/status`, payload);
  }
}
