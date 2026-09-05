import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../services/auth-session.service';

export const authGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  if (authSession.isAuthenticated()) {
    if (authSession.isSessionExpired()) {
      authSession.clearSession();
      return router.createUrlTree(['/iam/login']);
    }

    return true;
  }

  return router.createUrlTree(['/iam/login']);
};
