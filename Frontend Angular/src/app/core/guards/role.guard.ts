import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowed: string[] = route.data?.['roles'] ?? [];
  const role = auth.getRole();

  if (!role || (allowed.length && !allowed.includes(role))) {
    router.navigate(['/forbidden'], {
      state: {
        fromUrl: state.url,
        requiredRoles: allowed,
        actualRole: role,
      },
    });
    return false;
  }
  return true;
};
