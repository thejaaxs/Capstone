import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: auth.isSafeReturnUrl(state.url) ? { returnUrl: state.url } : undefined
    });
  }
  if (state.url === '' || state.url === '/') {
    return router.parseUrl(auth.getHomeRoute());
  }
  return true;
};
