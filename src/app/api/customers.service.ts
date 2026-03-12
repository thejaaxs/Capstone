import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Customer } from '../shared/models/customer.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomersApi {
  private base = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  list(token?: string): Observable<Customer[]> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<Customer[]>(`${this.base}`, { headers });
  }

  get(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.base}/${id}`);
  }

  add(c: Customer, token?: string): Observable<string> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post(`${this.base}`, c, { headers, responseType: 'text' });
  }

  update(id: number, c: Customer): Observable<string> {
    return this.http.put(`${this.base}/${id}`, c, { responseType: 'text' });
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/${id}`, { responseType: 'text' });
  }
}
