import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { TestRideBooking, TestRideDecision, TestRideSlot } from '../shared/models/test-ride.model';
import { LocalWorkflowStoreService } from '../core/services/local-workflow-store.service';

@Injectable({ providedIn: 'root' })
export class TestRidesApi {
  private readonly base = `${environment.apiUrl}/test-rides`;

  constructor(
    private http: HttpClient,
    private localStore: LocalWorkflowStoreService
  ) {}

  listSlots(dealerId: number, date: string): Observable<TestRideSlot[]> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.listSlots(dealerId, date));
    }
    const params = new HttpParams().set('dealerId', dealerId).set('date', date);
    return this.http.get<TestRideSlot[]>(`${this.base}/slots`, { params }).pipe(
      catchError((error) => this.useFallback(error, () => of(this.localStore.listSlots(dealerId, date))))
    );
  }

  create(payload: TestRideBooking): Observable<TestRideBooking> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.createTestRide(payload));
    }
    return this.http.post<TestRideBooking>(this.base, payload).pipe(
      catchError((error) => this.useFallback(error, () => of(this.localStore.createTestRide(payload))))
    );
  }

  byCustomer(customerId: number): Observable<TestRideBooking[]> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.listTestRidesByCustomer(customerId));
    }
    return this.http.get<TestRideBooking[]>(`${this.base}/customer/${customerId}`).pipe(
      catchError((error) => this.useFallback(error, () => of(this.localStore.listTestRidesByCustomer(customerId))))
    );
  }

  byDealer(dealerId: number): Observable<TestRideBooking[]> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.listTestRidesByDealer(dealerId));
    }
    return this.http.get<TestRideBooking[]>(`${this.base}/dealer/${dealerId}`).pipe(
      catchError((error) => this.useFallback(error, () => of(this.localStore.listTestRidesByDealer(dealerId))))
    );
  }

  updateStatus(id: number, payload: TestRideDecision): Observable<TestRideBooking> {
    if (environment.workflowDataMode === 'local') {
      const updated = this.localStore.updateTestRide(id, payload);
      return updated ? of(updated) : throwError(() => new Error(`Test ride ${id} not found`));
    }
    return this.http.put<TestRideBooking>(`${this.base}/${id}/status`, payload).pipe(
      catchError((error) => this.useFallback(error, () => {
        const updated = this.localStore.updateTestRide(id, payload);
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
