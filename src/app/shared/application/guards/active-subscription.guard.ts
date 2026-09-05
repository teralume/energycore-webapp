import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../services/auth-session.service';
import { ROUTE_PATHS } from '../../infrastructure/constants/route-paths';
import { BillingFacade } from '../../../billing/application/services/billing.facade';

export const activeSubscriptionGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const billingFacade = inject(BillingFacade);
  const router = inject(Router);

  if (!authSession.isAuthenticated()) {
    return router.createUrlTree([ROUTE_PATHS.IAM.LOGIN]);
  }

  if (authSession.isSessionExpired()) {
    authSession.clearSession();
    return router.createUrlTree([ROUTE_PATHS.IAM.LOGIN]);
  }

  return billingFacade.loadActiveSubscription().then(() => {
    if (billingFacade.hasActiveSubscription()) {
      return true;
    }

    return router.createUrlTree([ROUTE_PATHS.BILLING.PLANS]);
  }).catch((error) => {
    console.error(error);
    billingFacade.clearActiveSubscription();
    return router.createUrlTree([ROUTE_PATHS.BILLING.PLANS]);
  });
};
