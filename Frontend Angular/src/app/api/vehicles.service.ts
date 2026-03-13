import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Vehicle } from '../shared/models/vehicle.model';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VehiclesApi {
  private base = `${environment.apiUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  listAll(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.base}`).pipe(
      map((list) => list.map((v) => this.normalizeVehicle(v)))
    );
  }

  getById(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.base}/${id}`).pipe(
      map((v) => this.normalizeVehicle(v))
    );
  }

  listByDealer(dealerId: number): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.base}/dealer/${dealerId}`).pipe(
      map((list) => list.map((v) => this.normalizeVehicle(v)))
    );
  }

  add(v: Vehicle): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.base}`, v).pipe(
      map((created) => this.normalizeVehicle(created))
    );
  }

  update(id: number, v: Vehicle): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.base}/${id}`, v).pipe(
      map((updated) => this.normalizeVehicle(updated))
    );
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/${id}`, { responseType: 'text' });
  }

  uploadImage(id: number, file: File): Observable<Vehicle> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Vehicle>(`${this.base}/${id}/upload-image`, form).pipe(
      map((v) => this.normalizeVehicle(v))
    );
  }

  deleteImage(id: number): Observable<Vehicle> {
    return this.http.delete<Vehicle>(`${this.base}/${id}/delete-image`).pipe(
      map((v) => this.normalizeVehicle(v))
    );
  }

  private normalizeVehicle(v: Vehicle): Vehicle {
    const fuelType = (v?.fuelType || '').toUpperCase() === 'ELECTRIC' ? 'ELECTRIC' : 'PETROL';
    const rideType = !v?.rideType ? v?.rideType : (v.rideType || '').toUpperCase() === 'HIGHWAY' ? 'HIGHWAY' : 'CITY';
    const mileage = this.normalizePositiveNumber(v?.mileage);
    const suitableDailyKm = this.normalizePositiveNumber(v?.suitableDailyKm);
    const normalized = { ...v, fuelType, rideType, mileage, suitableDailyKm };
    if (!v?.imageUrl) return normalized;
    const safeImageUrl = this.normalizeImageUrl(v.imageUrl);
    if (!safeImageUrl) {
      return normalized;
    }
    return { ...normalized, imageUrl: safeImageUrl };
  }

  private normalizePositiveNumber(value?: number | null): number | undefined {
    const normalized = Number(value);
    return Number.isFinite(normalized) && normalized > 0 ? normalized : undefined;
  }

  private normalizeImageUrl(imageUrl: string): string | null {
    if (imageUrl.startsWith('/api') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    const isAbsoluteUrl = /^[a-z]+:\/\//i.test(imageUrl);
    if (isAbsoluteUrl) {
      try {
        const parsed = new URL(imageUrl);
        if (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname) && parsed.pathname.startsWith('/uploads/')) {
          return `${environment.apiUrl}${parsed.pathname}`;
        }
      } catch {
        return null;
      }
      return null;
    }

    const prefix = imageUrl.startsWith('/') ? '' : '/';
    return `${environment.apiUrl}${prefix}${imageUrl}`;
  }
}
