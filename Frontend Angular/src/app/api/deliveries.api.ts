import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeliverySchedule } from '../shared/models/delivery.model';
import { LocalWorkflowStoreService } from '../core/services/local-workflow-store.service';

@Injectable({ providedIn: 'root' })
export class DeliveriesApi {
  private readonly base = `${environment.apiUrl}/deliveries`;

  constructor(
    private http: HttpClient,
    private localStore: LocalWorkflowStoreService
  ) {}

  create(payload: DeliverySchedule): Observable<DeliverySchedule> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.createDelivery(payload));
    }
    return this.http.post<DeliverySchedule>(this.base, payload).pipe(
      catchError((error) => this.useFallback(error, () => of(this.localStore.createDelivery(payload))))
    );
  }

  byCustomer(customerId: number): Observable<DeliverySchedule[]> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.listDeliveriesByCustomer(customerId));
    }
    return this.http.get<DeliverySchedule[]>(`${this.base}/customer/${customerId}`).pipe(
      catchError((error) => this.useFallback(error, () => of(this.localStore.listDeliveriesByCustomer(customerId))))
    );
  }

  byDealer(dealerId: number): Observable<DeliverySchedule[]> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.listDeliveriesByDealer(dealerId));
    }
    return this.http.get<DeliverySchedule[]>(`${this.base}/dealer/${dealerId}`).pipe(
      catchError((error) => this.useFallback(error, () => of(this.localStore.listDeliveriesByDealer(dealerId))))
    );
  }

  update(id: number, payload: Partial<DeliverySchedule>): Observable<DeliverySchedule> {
    if (environment.workflowDataMode === 'local') {
      const updated = this.localStore.updateDelivery(id, payload);
      return updated ? of(updated) : throwError(() => new Error(`Delivery ${id} not found`));
    }
    return this.http.put<DeliverySchedule>(`${this.base}/${id}`, payload).pipe(
      catchError((error) => this.useFallback(error, () => {
        const updated = this.localStore.updateDelivery(id, payload);
        return updated ? of(updated) : throwError(() => error);
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
