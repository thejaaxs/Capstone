import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GstInvoice } from '../shared/models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoicesApi {
  private readonly base = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  generate(payload: Partial<GstInvoice>): Observable<GstInvoice> {
    return this.http.post<GstInvoice>(`${this.base}/generate`, payload);
  }

  byBooking(bookingId: number): Observable<GstInvoice> {
    return this.http.get<GstInvoice>(`${this.base}/booking/${bookingId}`);
  }
}
