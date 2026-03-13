import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const isPublicGet =
    req.method === 'GET' &&
    (req.url.includes('/dealers') || req.url.includes('/vehicles') || req.url.includes('/uploads/'));

  if (!token || isPublicGet || req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(cloned);
};
