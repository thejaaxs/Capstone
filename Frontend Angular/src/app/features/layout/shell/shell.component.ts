import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { TopNavComponent } from '../top-nav/top-nav.component';
import { AppFooterComponent } from '../../../shared/ui/app-footer.component';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [CommonModule, RouterOutlet, TopNavComponent, AppFooterComponent],
  template: `
  <div class="shell-layout">
    <app-top-nav></app-top-nav>
    <div class="shell-main">
      <div class="route-loading" *ngIf="loading"></div>
      <main class="shell-content">
        <router-outlet></router-outlet>
      </main>
    </div>
    <app-footer></app-footer>
  </div>
  `,
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  loading = false;

  constructor(router: Router) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loading = true;
      }
      if (event instanceof NavigationEnd || event instanceof NavigationError) {
        this.loading = false;
      }
    });
  }
}


