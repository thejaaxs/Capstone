import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, InternalUserResponse } from '../shared/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private base = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  register(payload: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.base}/register`, payload);
  }

  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.base}/login`, payload);
  }

  me() {
    return this.http.get<InternalUserResponse>(`${this.base}/me`);
  }

  internalUser(email: string) {
    return this.http.get<InternalUserResponse>(`${this.base}/internal/user`, {
      params: { email }
    });
  }
}
