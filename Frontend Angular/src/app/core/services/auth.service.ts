import { Injectable } from '@angular/core';
import { AuthResponse, UserRole } from '../../shared/models/auth.model';

const KEY = 'jwt_auth_v1';
const PROFILE_KEY = 'jwt_profile_ctx_v1';

export interface JwtAuthState {
  token: string;
  emailId: string;
  role: UserRole;
}

interface ProfileContextState {
  dealerId?: number;
  customerId?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly roleHomeMap: Record<UserRole, string> = {
    ROLE_CUSTOMER: '/customer/vehicles',
    ROLE_DEALER: '/dealer/dashboard',
    ROLE_ADMIN: '/admin/analytics',
  };
  private readonly publicReturnPrefixes = ['/home', '/vehicles'];

  getState(): JwtAuthState | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as JwtAuthState;
    } catch {
      localStorage.removeItem(KEY);
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getState()?.token;
  }

  saveLogin(res: AuthResponse) {
    const state: JwtAuthState = {
      token: res.token,
      emailId: res.emailId,
      role: res.role,
    };
    localStorage.setItem(KEY, JSON.stringify(state));
    localStorage.removeItem(PROFILE_KEY);
  }

  clearSession() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(PROFILE_KEY);
  }

  logout() {
    this.clearSession();
  }

  getToken(): string | null {
    return this.getState()?.token ?? null;
  }

  getRole(): UserRole | null {
    return this.getState()?.role ?? null;
  }

  getEmail(): string | null {
    return this.getState()?.emailId ?? null;
  }

  getHomeRoute(role = this.getRole()): string {
    if (!role) return '/login';
    return this.roleHomeMap[role] ?? '/login';
  }

  isSafeReturnUrl(url: string | null | undefined): url is string {
    return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
  }

  resolvePostLoginUrl(returnUrl: string | null | undefined, role = this.getRole()): string {
    if (!role) return '/login';
    if (!this.isSafeReturnUrl(returnUrl)) {
      return this.getHomeRoute(role);
    }

    if (this.publicReturnPrefixes.some((prefix) => returnUrl === prefix || returnUrl.startsWith(`${prefix}?`))) {
      return returnUrl;
    }

    if (role === 'ROLE_CUSTOMER' && returnUrl.startsWith('/customer/')) {
      return returnUrl;
    }

    if (role === 'ROLE_DEALER' && returnUrl.startsWith('/dealer/')) {
      return returnUrl;
    }

    if (role === 'ROLE_ADMIN' && returnUrl.startsWith('/admin/')) {
      return returnUrl;
    }

    return this.getHomeRoute(role);
  }

  getDealerId(): number | null {
    return this.getProfileState()?.dealerId ?? null;
  }

  setDealerId(dealerId: number): void {
    if (!Number.isFinite(dealerId) || dealerId <= 0) return;
    const state = this.getProfileState() || {};
    state.dealerId = dealerId;
    this.setProfileState(state);
  }

  getCustomerId(): number | null {
    return this.getProfileState()?.customerId ?? null;
  }

  setCustomerId(customerId: number): void {
    if (!Number.isFinite(customerId) || customerId <= 0) return;
    const state = this.getProfileState() || {};
    state.customerId = customerId;
    this.setProfileState(state);
  }

  private getProfileState(): ProfileContextState | null {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as ProfileContextState;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      localStorage.removeItem(PROFILE_KEY);
      return null;
    }
  }

  private setProfileState(state: ProfileContextState): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state));
  }
}
