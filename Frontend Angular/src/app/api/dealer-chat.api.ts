import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SKIP_GLOBAL_ERROR_HANDLING } from '../core/interceptors/error.interceptor';
import { ChatResponse, RecommendationRequest, VehicleRecommendation } from '../shared/models/dealer-chat.model';

@Injectable({ providedIn: 'root' })
export class DealerChatApi {
  private readonly base = `${environment.apiUrl}/dealer-chat`;
  private readonly silentContext = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);

  constructor(private http: HttpClient) {}

  sendMessage(payload: RecommendationRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.base}/message`, payload, { context: this.silentContext }).pipe(
      map((response) => ({
        ...response,
        recommendations: response.recommendations?.map((vehicle) => this.normalizeRecommendation(vehicle)) ?? null,
      }))
    );
  }

  private normalizeRecommendation(vehicle: VehicleRecommendation): VehicleRecommendation {
    if (!vehicle?.imageUrl) return vehicle;
    const safeImageUrl = this.normalizeImageUrl(vehicle.imageUrl);
    if (!safeImageUrl) {
      return vehicle;
    }
    return { ...vehicle, imageUrl: safeImageUrl };
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
