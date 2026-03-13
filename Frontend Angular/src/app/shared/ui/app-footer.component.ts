import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <section>
            <h4>MotoMint</h4>
            <p>Trusted two-wheeler marketplace for buyers, customers, and dealership partners across India.</p>
          </section>

          <section>
            <h5>Explore</h5>
            <div class="footer-links">
              <a routerLink="/home">Home</a>
              <a routerLink="/customer/vehicles">Vehicles</a>
              <a routerLink="/customer/bookings">Bookings</a>
              <a routerLink="/customer/favorites">Favorites</a>
            </div>
          </section>

          <section>
            <h5>For Dealers</h5>
            <div class="footer-links">
              <a routerLink="/dealer/dashboard">Dashboard</a>
              <a routerLink="/dealer/vehicles">Inventory</a>
              <a routerLink="/dealer/bookings">Bookings</a>
            </div>
          </section>

          <section>
            <h5>Company</h5>
            <div class="footer-links">
              <a routerLink="/login">Login</a>
              <a routerLink="/register">Register</a>
            </div>
          </section>
        </div>

        <div class="footer-legal">
          © {{ year }} MotoMint. All rights reserved.
        </div>
      </div>
    </footer>
  `
})
export class AppFooterComponent {
  year = new Date().getFullYear();
}

