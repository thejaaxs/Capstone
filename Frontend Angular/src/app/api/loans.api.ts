import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoanApplication } from '../shared/models/loan.model';
import { LocalWorkflowStoreService } from '../core/services/local-workflow-store.service';

@Injectable({ providedIn: 'root' })
export class LoansApi {
  private readonly base = `${environment.apiUrl}/loans`;

  constructor(
    private http: HttpClient,
    private localStore: LocalWorkflowStoreService
  ) {}

  create(payload: LoanApplication): Observable<LoanApplication> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.createLoan(payload));
    }
    return this.http.post<LoanApplication>(this.base, payload).pipe(
      catchError((error) => this.useFallback(error, () => of(this.localStore.createLoan(payload))))
    );
  }

  byCustomer(customerId: number): Observable<LoanApplication[]> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.listLoansByCustomer(customerId));
    }
    return this.http.get<LoanApplication[]>(`${this.base}/customer/${customerId}`).pipe(
      catchError((error) => this.useFallback(error, () => of(this.localStore.listLoansByCustomer(customerId))))
    );
  }

  byDealer(dealerId: number): Observable<LoanApplication[]> {
    if (environment.workflowDataMode === 'local') {
      return of(this.localStore.listLoansByDealer(dealerId));
    }
    return this.http.get<LoanApplication[]>(`${this.base}/dealer/${dealerId}`).pipe(
      catchError((error) => this.useFallback(error, () => of(this.localStore.listLoansByDealer(dealerId))))
    );
  }

  updateStatus(id: number, payload: Partial<LoanApplication>): Observable<LoanApplication> {
    if (environment.workflowDataMode === 'local') {
      const updated = this.localStore.updateLoan(id, payload);
      return updated ? of(updated) : throwError(() => new Error(`Loan ${id} not found`));
    }
    return this.http.put<LoanApplication>(`${this.base}/${id}/status`, payload).pipe(
      catchError((error) => this.useFallback(error, () => {
        const updated = this.localStore.updateLoan(id, payload);
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
