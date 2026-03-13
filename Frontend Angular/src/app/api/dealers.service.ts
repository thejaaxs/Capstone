import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Dealer } from '../shared/models/dealer.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DealersApi {
  private base = `${environment.apiUrl}/dealers`;

  constructor(private http: HttpClient) {}

  list(token?: string): Observable<Dealer[]> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<Dealer[]>(`${this.base}/list`, { headers });
  }

  get(id: number): Observable<Dealer> {
    return this.http.get<Dealer>(`${this.base}/${id}`);
  }

  add(d: Partial<Dealer>, token?: string): Observable<string> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post(`${this.base}/add`, d, { headers, responseType: 'text' });
  }

  update(id: number, d: Partial<Dealer>): Observable<string> {
    return this.http.put(`${this.base}/${id}`, d, { responseType: 'text' });
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/${id}`, { responseType: 'text' });
  }
}
  
