import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (): Promise<boolean | UrlTree> | boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.loading()) {
    return auth.isLoggedIn ? true : router.createUrlTree(['/login']);
  }

  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (!auth.loading()) {
        clearInterval(interval);
        resolve(auth.isLoggedIn ? true : router.createUrlTree(['/login']));
      }
    }, 50);
  });
};
