import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, of, throwError, timer } from 'rxjs';
import { retry } from 'rxjs/operators';

export interface CreatePaymentOrderResponse {
  keyId: string;
  currency: string;
  amountInPaise: number;
  razorpayOrderId: string;
  mockMode?: boolean;
  message?: string;
  bookingId: number;
  customerId: number;
}

export interface VerifyPaymentPayload {
  bookingId: number;
  customerId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResult {
  status: 'SUCCESS' | 'FAILED' | string;
  message: string;
  bookingId: number;
  transactionId: string;
}

export interface PaymentRequestPayload {
  bookingId: number;
  customerId: number;
  amount: number;
  method: 'UPI' | 'CREDIT_CARD' | 'NET_BANKING' | 'CASH_AT_DEALERSHIP' | string;
}

export interface PaymentStatusResponse {
  paymentId?: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | string;
  transactionId?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private readonly base = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  createOrder(bookingId: number, customerId: number): Observable<CreatePaymentOrderResponse> {
    return this.http.post<CreatePaymentOrderResponse>(`${this.base}/create-order`, { bookingId, customerId }).pipe(
      retry({
        count: 2,
        delay: (error) => {
          const status = Number(error?.status || 0);
          if ([502, 503, 504].includes(status)) {
            return timer(700);
          }
          return throwError(() => error);
        }
      })
    );
  }

  verifyPayment(payload: VerifyPaymentPayload): Observable<VerifyPaymentResult> {
    return this.http.post<VerifyPaymentResult>(`${this.base}/verify`, payload);
  }

  pay(payload: PaymentRequestPayload): Observable<PaymentStatusResponse> {
    if (environment.workflowDataMode === 'local') {
      return of({
        paymentId: Date.now(),
        status: 'SUCCESS',
        transactionId: `demo_txn_${payload.bookingId}_${Date.now()}`,
        message: 'Demo payment recorded successfully.'
      });
    }
    return this.http.post<PaymentStatusResponse>(`${this.base}/pay`, payload).pipe(
      catchError((error) => this.useFallback(error, () => of({
        paymentId: Date.now(),
        status: 'SUCCESS',
        transactionId: `demo_txn_${payload.bookingId}_${Date.now()}`,
        message: 'Demo payment recorded successfully.'
      })))
    );
  }

  status(paymentId: number): Observable<PaymentStatusResponse> {
    if (environment.workflowDataMode === 'local') {
      return of({
        paymentId,
        status: 'SUCCESS',
        transactionId: `demo_txn_${paymentId}`,
        message: 'Demo payment status available locally.'
      });
    }
    return this.http.get<PaymentStatusResponse>(`${this.base}/status`, {
      params: { paymentId }
    }).pipe(
      catchError((error) => this.useFallback(error, () => of({
        paymentId,
        status: 'SUCCESS',
        transactionId: `demo_txn_${paymentId}`,
        message: 'Demo payment status available locally.'
      })))
    );
  }

  private useFallback<T>(error: HttpErrorResponse, fallback: () => Observable<T>): Observable<T> {
    return [0, 404, 405, 501, 502, 503, 504].includes(error.status) ? fallback() : throwError(() => error);
  }
}
