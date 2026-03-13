import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { GstInvoice } from '../shared/models/invoice.model';
import { LocalWorkflowStoreService } from '../core/services/local-workflow-store.service';

@Injectable({ providedIn: 'root' })
export class InvoicesApi {
  private readonly base = `${environment.apiUrl}/invoices`;

  constructor(
    private http: HttpClient,
    private localStore: LocalWorkflowStoreService
  ) {}

  generate(payload: Partial<GstInvoice>): Observable<GstInvoice> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.generateInvoice(payload));
    }
    return this.http.post<GstInvoice>(`${this.base}/generate`, payload).pipe(
      catchError((error) => this.useFallback(error, () => of(this.localStore.generateInvoice(payload))))
    );
  }

  byBooking(bookingId: number): Observable<GstInvoice> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.getInvoiceByBooking(bookingId) || this.localStore.generateInvoice({ bookingId }));
    }
    return this.http.get<GstInvoice>(`${this.base}/booking/${bookingId}`).pipe(
      catchError((error) => this.useFallback(error, () => {
        const invoice = this.localStore.getInvoiceByBooking(bookingId) || this.localStore.generateInvoice({ bookingId });
        return of(invoice);
      }))
    );
  }

  private useFallback<T>(error: HttpErrorResponse, fallback: () => Observable<T>): Observable<T> {
    return this.isMissingWorkflowApi(error) ? fallback() : throwError(() => error);
  }

  private isMissingWorkflowApi(error: HttpErrorResponse): boolean {
    return [0, 404, 405, 501, 502, 503, 504].includes(error.status);
  }
}
