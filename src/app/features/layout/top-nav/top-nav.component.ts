import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DealerNotificationItem, DealerNotificationsService } from '../../../core/services/dealer-notifications.service';
import { ThemeService } from '../../../core/services/theme.service';
import { UserRole } from '../../../shared/models/auth.model';

interface NavItem {
  label: string;
  path: string;
}

@Component({
  standalone: true,
  selector: 'app-top-nav',
  imports: [CommonModule, RouterLink, RouterLinkActive],
	  template: `
	    <header class="mm-topnav">
	      <div class="mm-topnav-inner" [class.guest-mode]="!isAuthenticated">
	        <button *ngIf="isAuthenticated" type="button" class="menu-toggle" (click)="toggleMobileNav($event)" aria-label="Toggle navigation">
	          <span></span>
	          <span></span>
	          <span></span>
	        </button>

		        <a class="brand" routerLink="/home" (click)="closeAllMenus()">
		          <span class="brand-mark">MM</span>
		          <span class="brand-text">
		            <strong>MotoMint</strong>
		            <small>Two-wheeler marketplace</small>
		          </span>
		        </a>

	        <button *ngIf="!isAuthenticated" type="button" class="guest-login-link btn btn-ghost" (click)="openSignIn()">
	          Sign In
	        </button>

	        <button
	          *ngIf="!isAuthenticated"
	          type="button"
	          class="theme-toggle guest-theme-toggle btn btn-ghost"
	          aria-label="Toggle dark mode"
	          title="Toggle dark mode"
	          [attr.aria-pressed]="isDarkMode"
	          (click)="toggleTheme($event)"
	        >
	          <span class="theme-icon">{{ isDarkMode ? '\u2600' : '\u263E' }}</span>
	        </button>

        <nav class="nav-links desktop-nav" *ngIf="navLinks.length && isAuthenticated">
          <a *ngFor="let link of navLinks" [routerLink]="link.path" routerLinkActive="active">{{ link.label }}</a>
        </nav>

	        <div class="quick-actions">
	          <button
	            type="button"
	            class="theme-toggle btn btn-ghost"
	            aria-label="Toggle dark mode"
	            title="Toggle dark mode"
	            [attr.aria-pressed]="isDarkMode"
	            (click)="toggleTheme($event)"
	            *ngIf="isAuthenticated"
	          >
	            <span class="theme-icon">{{ isDarkMode ? '\u2600' : '\u263E' }}</span>
	          </button>

	          <div class="notification-wrap" *ngIf="showDealerNotifications">
            <button
              type="button"
              class="bell-btn"
              aria-label="Dealer notifications"
              (click)="toggleNotifications($event)"
            >
              <span class="bell-icon">{{ '\u{1F514}' }}</span>
              <span class="bell-count" *ngIf="unreadNotifications > 0">{{ unreadNotifications }}</span>
            </button>

            <div class="notifications-menu" *ngIf="notificationOpen" (click)="$event.stopPropagation()">
              <div class="notifications-head">
                <strong>Notifications</strong>
                <button type="button" class="btn btn-ghost" (click)="markAllNotificationsRead($event)">Mark all read</button>
              </div>

              <p class="notifications-empty" *ngIf="dealerNotifications.length === 0">
                No payment notifications yet.
              </p>

              <article class="note-item" *ngFor="let item of dealerNotifications | slice:0:6">
                <p class="note-message">{{ item.message }}</p>
                <small *ngIf="item.amount !== undefined">Amount: INR {{ item.amount | number: '1.0-0' }}</small>
                <small *ngIf="item.createdAt">{{ item.createdAt | date: 'medium' }}</small>
              </article>

	              <button type="button" class="btn btn-ghost note-footer-btn" (click)="openDealerBookings()">
	                Open Bookings
	              </button>
	            </div>
	          </div>
	        </div>

        <div class="account-wrap" *ngIf="isAuthenticated">
          <button type="button" class="profile-btn" (click)="toggleProfile($event)">
            <span class="profile-meta">
              <span class="profile-email" [title]="email || ''">{{ email || 'user' }}</span>
              <span class="role-badge">{{ roleLabel }}</span>
            </span>
            <span class="caret" [class.open]="profileOpen"></span>
          </button>

          <div class="profile-menu" *ngIf="profileOpen">
            <ng-container *ngIf="role === 'ROLE_CUSTOMER'; else defaultProfileMenu">
              <button type="button" class="btn btn-ghost" (click)="goCustomerOrders()">My Orders</button>
              <button type="button" class="btn btn-ghost" (click)="goCustomerFavorites()">Favorites</button>
              <button type="button" class="btn btn-danger" (click)="logout()">Logout</button>
            </ng-container>

            <ng-template #defaultProfileMenu>
              <button type="button" class="btn btn-ghost" (click)="goHome()">Home</button>
              <button type="button" class="btn btn-danger" (click)="logout()">Logout</button>
            </ng-template>
          </div>
        </div>
      </div>

      <div class="mobile-drawer" *ngIf="mobileNavOpen">
        <nav class="nav-links mobile-nav" *ngIf="navLinks.length">
          <a *ngFor="let link of navLinks" [routerLink]="link.path" routerLinkActive="active" (click)="closeAllMenus()">
            {{ link.label }}
          </a>
        </nav>
	        <div class="mobile-theme">
	          <button type="button" class="btn btn-ghost" aria-label="Toggle dark mode" title="Toggle dark mode" (click)="toggleTheme()">
	            <span class="theme-icon">{{ isDarkMode ? '\u2600' : '\u263E' }}</span>
	          </button>
	        </div>
	      </div>
	    </header>
	  `,
  styleUrl: './top-nav.component.css'
})
export class TopNavComponent implements OnInit, OnDestroy {
  @Input() publicMode = false;

  role: UserRole | null;
  email: string | null;
  navLinks: NavItem[] = [];
  profileOpen = false;
  mobileNavOpen = false;
  notificationOpen = false;
  dealerNotifications: DealerNotificationItem[] = [];
  unreadNotifications = 0;
  private subs = new Subscription();
  private notificationsStarted = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private theme: ThemeService,
    private dealerNotificationsService: DealerNotificationsService
  ) {
    this.role = this.auth.getRole();
    this.email = this.auth.getEmail();
    this.navLinks = this.buildNavLinks(this.role);

    const routeSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.closeAllMenus());
    this.subs.add(routeSub);
  }

  ngOnInit(): void {
    if (this.showDealerNotifications) {
      this.startDealerNotifications();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.notificationsStarted) {
      this.dealerNotificationsService.stop();
    }
  }

  get isAuthenticated(): boolean {
    if (this.publicMode) return false;
    return !!this.role;
  }

  get isDarkMode(): boolean {
    return this.theme.isDark();
  }

  get showDealerNotifications(): boolean {
    return !this.publicMode && this.role === 'ROLE_DEALER';
  }

  get roleLabel(): string {
    return (this.role || 'ROLE_GUEST').replace('ROLE_', '');
  }

  toggleProfile(event: MouseEvent) {
    event.stopPropagation();
    this.profileOpen = !this.profileOpen;
    this.mobileNavOpen = false;
    this.notificationOpen = false;
  }

  toggleMobileNav(event: MouseEvent) {
    event.stopPropagation();
    this.mobileNavOpen = !this.mobileNavOpen;
    this.profileOpen = false;
    this.notificationOpen = false;
  }

  toggleTheme(event?: MouseEvent) {
    event?.stopPropagation();
    this.theme.toggle();
  }

  toggleNotifications(event: MouseEvent) {
    event.stopPropagation();
    this.notificationOpen = !this.notificationOpen;
    this.profileOpen = false;
    if (this.notificationOpen) {
      this.mobileNavOpen = false;
    }
  }

  markAllNotificationsRead(event: MouseEvent) {
    event.stopPropagation();
    this.dealerNotificationsService.markAllRead();
  }

  openDealerBookings() {
    this.closeAllMenus();
    this.router.navigateByUrl('/dealer/bookings');
  }

  openSignIn() {
    this.closeAllMenus();
    const currentUrl = this.router.url;
    const returnUrl = this.auth.isSafeReturnUrl(currentUrl) && !['/login', '/register'].includes(currentUrl.split('?')[0])
      ? currentUrl
      : null;

    this.router.navigate(['/login'], {
      queryParams: returnUrl ? { returnUrl } : undefined
    });
  }

  logout() {
    if (this.notificationsStarted) {
      this.dealerNotificationsService.stop();
      this.notificationsStarted = false;
    }
    this.auth.logout();
    this.closeAllMenus();
    this.router.navigateByUrl('/login');
  }

  goHome() {
    this.closeAllMenus();
    this.router.navigateByUrl(this.auth.getHomeRoute(this.role));
  }

  goCustomerOrders() {
    this.closeAllMenus();
    this.router.navigateByUrl('/customer/bookings');
  }

  goCustomerFavorites() {
    this.closeAllMenus();
    this.router.navigateByUrl('/customer/favorites');
  }

  closeAllMenus() {
    this.profileOpen = false;
    this.mobileNavOpen = false;
    this.notificationOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeAllMenus();
  }

  private buildNavLinks(role: UserRole | null): NavItem[] {
    if (role === 'ROLE_CUSTOMER') {
      return [
        { label: 'Vehicles', path: '/customer/vehicles' },
        { label: 'Dealers', path: '/customer/dealers' },
        { label: 'Test Ride', path: '/customer/test-ride' },
        { label: 'Loan', path: '/customer/loan' },
        { label: 'Bookings', path: '/customer/bookings' },
        { label: 'Delivery', path: '/customer/delivery' },
      ];
    }

    if (role === 'ROLE_DEALER') {
      return [
        { label: 'Dashboard', path: '/dealer/dashboard' },
        { label: 'Vehicles', path: '/dealer/vehicles' },
        { label: 'Test Rides', path: '/dealer/test-rides' },
        { label: 'Bookings', path: '/dealer/bookings' },
        { label: 'Loans', path: '/dealer/loan-approvals' },
        { label: 'Delivery', path: '/dealer/delivery' },
      ];
    }

    if (role === 'ROLE_ADMIN') {
      return [
        { label: 'Analytics', path: '/admin/analytics' },
        { label: 'Dealers', path: '/admin/dealers' },
        { label: 'Vehicles', path: '/admin/vehicles' },
        { label: 'Payments', path: '/admin/payments' },
      ];
    }
	
	    return [];
	  }

  private startDealerNotifications(): void {
    this.notificationsStarted = true;
    this.dealerNotificationsService.start();
    this.subs.add(this.dealerNotificationsService.items$.subscribe((items) => {
      this.dealerNotifications = items;
    }));
    this.subs.add(this.dealerNotificationsService.unreadCount$.subscribe((count) => {
      this.unreadNotifications = count;
    }));
  }
}
