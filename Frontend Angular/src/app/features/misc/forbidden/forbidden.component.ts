import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Route, Router } from '@angular/router';
import { Subscription, interval, take } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserRole } from '../../../shared/models/auth.model';

interface ForbiddenNavigationState {
  fromUrl?: string;
  requiredRoles?: string[];
  actualRole?: UserRole | null;
}

@Component({
  standalone: true,
  selector: 'app-forbidden',
  imports: [CommonModule],
  templateUrl: './forbidden.component.html',
  styleUrl: './forbidden.component.css'
})
export class ForbiddenComponent implements OnInit, OnDestroy {
  readonly totalSeconds = 5;

  remainingSeconds = this.totalSeconds;
  progressPercent = 0;
  fromUrl = '';
  requiredRoles: string[] = [];
  actualRole: UserRole | null = null;
  redirectTarget = '/login';
  redirected = false;

  private countdownSub?: Subscription;
  private redirectTimerId?: number;
  private countdownToastId?: number;

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.applyNavigationState();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.cleanupCountdown();
  }

  get countdownText(): string {
    const unit = this.remainingSeconds === 1 ? 'second' : 'seconds';
    return `Redirecting to Home in ${this.remainingSeconds} ${unit}...`;
  }

  get roleHint(): string {
    return (this.actualRole || 'ROLE_GUEST').replace('ROLE_', '');
  }

  get requiredRolesHint(): string {
    if (!this.requiredRoles.length) return 'N/A';
    return this.requiredRoles.map((role) => role.replace('ROLE_', '')).join(', ');
  }

  goNow() {
    this.redirectNow();
  }

  private applyNavigationState() {
    const state = this.readNavigationState();
    this.fromUrl = state.fromUrl || '';
    this.requiredRoles = Array.isArray(state.requiredRoles) ? state.requiredRoles : [];
    this.actualRole = this.isUserRole(state.actualRole) ? state.actualRole : this.auth.getRole();
    this.redirectTarget = this.resolveRedirectTarget(this.actualRole);
  }

  private readNavigationState(): ForbiddenNavigationState {
    const current = this.router.getCurrentNavigation()?.extras.state as ForbiddenNavigationState | undefined;
    const history = window.history.state as ForbiddenNavigationState | undefined;
    return current ?? history ?? {};
  }

  private isUserRole(role: unknown): role is UserRole {
    return role === 'ROLE_CUSTOMER' || role === 'ROLE_DEALER' || role === 'ROLE_ADMIN';
  }

  private resolveRedirectTarget(role: UserRole | null): string {
    if (!role) return '/login';

    if (role === 'ROLE_DEALER') {
      return this.resolveFirstExisting(['/dealer/vehicles', '/dealer/dashboard']);
    }

    if (role === 'ROLE_CUSTOMER') {
      return this.resolveFirstExisting(['/customer/vehicles', '/home']);
    }

    return this.resolveFirstExisting(['/admin/dealers', '/admin/customers']);
  }

  private resolveFirstExisting(candidates: string[]): string {
    for (const candidate of candidates) {
      if (this.routeExists(candidate)) {
        return candidate;
      }
    }
    return '/login';
  }

  private routeExists(path: string): boolean {
    const target = this.normalizePath(path);
    return this.routeTreeContains(this.router.config, target, '');
  }

  private routeTreeContains(routes: Route[], target: string, parentPath: string): boolean {
    for (const route of routes) {
      const currentPath = this.joinPaths(parentPath, route.path ?? '');
      if (this.normalizePath(currentPath) === target) {
        return true;
      }

      if (route.children?.length && this.routeTreeContains(route.children, target, currentPath)) {
        return true;
      }
    }

    return false;
  }

  private joinPaths(parent: string, child: string): string {
    if (!parent) return child;
    if (!child) return parent;
    return `${parent}/${child}`;
  }

  private normalizePath(path: string): string {
    return path.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
  }

  private startCountdown() {
    this.pushCountdownToast(this.remainingSeconds);

    this.countdownSub = interval(1000)
      .pipe(take(this.totalSeconds))
      .subscribe((tick) => {
        const elapsed = tick + 1;
        this.remainingSeconds = Math.max(this.totalSeconds - elapsed, 0);
        this.progressPercent = Math.min((elapsed / this.totalSeconds) * 100, 100);

        if (this.remainingSeconds > 0) {
          this.pushCountdownToast(this.remainingSeconds);
        }
      });

    this.redirectTimerId = window.setTimeout(() => {
      this.redirectNow();
    }, this.totalSeconds * 1000);
  }

  private pushCountdownToast(seconds: number) {
    if (this.countdownToastId !== undefined) {
      this.toast.dismiss(this.countdownToastId);
    }

    const unit = seconds === 1 ? 'second' : 'seconds';
    this.countdownToastId = this.toast.error(`Access denied. Redirecting in ${seconds} ${unit}...`);
  }

  private cleanupCountdown() {
    this.countdownSub?.unsubscribe();
    this.countdownSub = undefined;

    if (this.redirectTimerId !== undefined) {
      window.clearTimeout(this.redirectTimerId);
      this.redirectTimerId = undefined;
    }

    if (this.countdownToastId !== undefined) {
      this.toast.dismiss(this.countdownToastId);
      this.countdownToastId = undefined;
    }
  }

  private redirectNow() {
    if (this.redirected) return;
    this.redirected = true;

    this.cleanupCountdown();
    this.router.navigateByUrl(this.redirectTarget);
  }
}

