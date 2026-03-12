import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Favorite } from '../shared/models/favorite.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FavoritesApi {
  private base = `${environment.apiUrl}/favorites`;

  constructor(private http: HttpClient) {}

  list(): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(`${this.base}/list`);
  }

  add(fav: Favorite): Observable<Favorite> {
    return this.http.post<Favorite>(`${this.base}/add`, fav);
  }

  getById(id: number): Observable<Favorite> {
    return this.http.get<Favorite>(`${this.base}/${id}`);
  }

  updateByName(name: string, fav: Favorite): Observable<string> {
    return this.http.put(`${this.base}/updateByName?name=${encodeURIComponent(name)}`, fav, { responseType: 'text' });
  }

  updateById(id: number, fav: Favorite): Observable<Favorite> {
    return this.http.put<Favorite>(`${this.base}/${id}`, fav);
  }

  deleteById(id: number): Observable<string> {
    return this.http.delete(`${this.base}/${id}`, { responseType: 'text' });
  }

  deleteByName(name: string): Observable<string> {
    return this.http.delete(`${this.base}/deleteByName?name=${encodeURIComponent(name)}`, { responseType: 'text' });
  }

  deleteByProductName(product: string): Observable<string> {
    return this.http.delete(`${this.base}/deleteByProductName?product=${encodeURIComponent(product)}`, { responseType: 'text' });
  }

  listByReason(reason: string): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(`${this.base}/listByReason?reason=${encodeURIComponent(reason)}`);
  }

  byName(name: string): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(`${this.base}/byName?name=${encodeURIComponent(name)}`);
  }
}
