import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Review, ReviewCreateRequest, ReviewUpdateRequest } from '../shared/models/review.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReviewsApi {
  private base = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  list(customerId?: number): Observable<Review[]> {
    const url = customerId ? `${this.base}/list?customerId=${customerId}` : `${this.base}/list`;
    return this.http.get<Review[]>(url);
  }

  add(r: ReviewCreateRequest): Observable<Review> {
    return this.http.post<Review>(`${this.base}/add`, r);
  }

  update(id: number, payload: ReviewUpdateRequest): Observable<Review> {
    return this.http.put<Review>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/${id}`, { responseType: 'text' });
  }

  byProductName(productName: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/byProductName/${encodeURIComponent(productName)}`);
  }

  adminAll(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/admin/all`);
  }
}
