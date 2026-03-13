import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
  <aside class="sidebar">
    <div class="brand">
      <h2>MotoMint</h2>
      <small>Find. Compare. Book.</small>
    </div>

    <div class="menu-group" *ngIf="role==='ROLE_CUSTOMER'">
      <p>Customer</p>
      <a routerLink="/customer/vehicles" routerLinkActive="active">Browse Vehicles</a>
      <a routerLink="/customer/bookings" routerLinkActive="active">My Bookings</a>
      <a routerLink="/customer/favorites" routerLinkActive="active">Favorites</a>
      <a routerLink="/customer/reviews" routerLinkActive="active">Reviews</a>
      <a routerLink="/customer/payments" routerLinkActive="active">Payments</a>
    </div>

    <div class="menu-group" *ngIf="role==='ROLE_DEALER'">
      <p>Dealer</p>
      <a routerLink="/dealer/dashboard" routerLinkActive="active">Dashboard</a>
      <a routerLink="/dealer/vehicles" routerLinkActive="active">Vehicles</a>
      <a routerLink="/dealer/bookings" routerLinkActive="active">Dealer Bookings</a>
    </div>

    <div class="menu-group" *ngIf="role==='ROLE_ADMIN'">
      <p>Admin</p>
      <a routerLink="/admin/dealers" routerLinkActive="active">Manage Dealers</a>
      <a routerLink="/admin/customers" routerLinkActive="active">Manage Customers</a>
    </div>
  </aside>
  `
  ,
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  role: ReturnType<AuthService['getRole']>;
  constructor(private auth: AuthService) {
    this.role = this.auth.getRole();
  }
}


