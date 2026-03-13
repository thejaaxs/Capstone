import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/models/auth.model';

interface NavItem {
  label: string;
  path: string;
}

@Component({
  standalone: true,
  selector: 'app-topbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="topbar-inner">
        <button type="button" class="menu-toggle" (click)="toggleMobileNav($event)" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <a class="brand" [routerLink]="homeRoute" (click)="closeAllMenus()">
          <span class="brand-mark">MM</span>
          <span class="brand-text">
            <strong>MotoMint</strong>
            <small>Two-wheeler marketplace</small>
          </span>
        </a>

        <nav class="nav-links desktop-nav" *ngIf="navLinks.length">
          <a
            *ngFor="let link of navLinks"
            [routerLink]="link.path"
            routerLinkActive="active"
          >
            {{ link.label }}
          </a>
        </nav>

        <div class="profile-wrap">
          <button type="button" class="profile-btn" (click)="toggleProfile($event)">
            <span class="profile-meta">
              <span class="profile-email" [title]="email || ''">{{ email || 'guest' }}</span>
              <span class="role-badge">{{ roleLabel }}</span>
            </span>
            <span class="caret" [class.open]="profileOpen"></span>
          </button>

          <div class="profile-menu" *ngIf="profileOpen">
            <p class="menu-email" [title]="email || ''">{{ email || 'Not signed in' }}</p>
            <p class="menu-role">{{ roleLabel }}</p>
            <button type="button" class="btn btn-ghost" (click)="goHome()">Home</button>
            <button type="button" class="btn btn-danger" (click)="logout()">Logout</button>
          </div>
        </div>
      </div>

      <nav class="nav-links mobile-nav" *ngIf="mobileNavOpen && navLinks.length">
        <a
          *ngFor="let link of navLinks"
          [routerLink]="link.path"
          routerLinkActive="active"
          (click)="closeAllMenus()"
        >
          {{ link.label }}
        </a>
      </nav>
    </header>
  `,
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {
  role: UserRole | null;
  email: string | null;
  homeRoute: string;
  navLinks: NavItem[] = [];
  profileOpen = false;
  mobileNavOpen = false;

  constructor(private auth: AuthService, private router: Router) {
    this.role = this.auth.getRole();
    this.email = this.auth.getEmail();
    this.homeRoute = this.auth.getHomeRoute(this.role);
    this.navLinks = this.buildNavLinks(this.role);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.closeAllMenus());
  }

  get roleLabel(): string {
    return (this.role || 'ROLE_GUEST').replace('ROLE_', '');
  }

  logout() {
    this.auth.logout();
    this.closeAllMenus();
    this.router.navigateByUrl('/login');
  }

  goHome() {
    this.closeAllMenus();
    this.router.navigateByUrl(this.homeRoute);
  }

  toggleProfile(event: MouseEvent) {
    event.stopPropagation();
    this.profileOpen = !this.profileOpen;
    this.mobileNavOpen = false;
  }

  toggleMobileNav(event: MouseEvent) {
    event.stopPropagation();
    this.mobileNavOpen = !this.mobileNavOpen;
    this.profileOpen = false;
  }

  closeAllMenus() {
    this.profileOpen = false;
    this.mobileNavOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeAllMenus();
  }

  private buildNavLinks(role: UserRole | null): NavItem[] {
    if (role === 'ROLE_CUSTOMER') {
      return [
        { label: 'Vehicles', path: '/customer/vehicles' },
        { label: 'Bookings', path: '/customer/bookings' },
        { label: 'Favorites', path: '/customer/favorites' },
        { label: 'Reviews', path: '/customer/reviews' },
      ];
    }

    if (role === 'ROLE_DEALER') {
      return [
        { label: 'Dashboard', path: '/dealer/dashboard' },
        { label: 'Vehicles', path: '/dealer/vehicles' },
        { label: 'Bookings', path: '/dealer/bookings' },
      ];
    }

    return [];
  }
}
