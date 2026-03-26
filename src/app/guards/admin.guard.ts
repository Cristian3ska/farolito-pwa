import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (): Promise<boolean | UrlTree> | boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.loading()) {
    return auth.isAdmin ? true : router.createUrlTree(['/home']);
  }

  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (!auth.loading()) {
        clearInterval(interval);
        resolve(auth.isAdmin ? true : router.createUrlTree(['/home']));
      }
    }, 50);
  });
};
