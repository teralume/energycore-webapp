import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AccessPermission } from '../../../iam/domain/model/access-permission.model';
import { ROUTE_PATHS } from '../../infrastructure/constants/route-paths';
import { AccessControlService } from '../services/access-control.service';
import { AuthSessionService } from '../services/auth-session.service';

export const accessPermissionGuard: CanActivateFn = (route) => {
  const authSession = inject(AuthSessionService);
  const accessControl = inject(AccessControlService);
  const router = inject(Router);

  if (!authSession.isAuthenticated() || authSession.isSessionExpired()) {
    authSession.clearSession();
    return router.createUrlTree([ROUTE_PATHS.IAM.LOGIN]);
  }

  const requiredPermissions =
    (route.data?.['requiredPermissions'] as AccessPermission[] | undefined) ?? [];

  if (requiredPermissions.length === 0 || accessControl.hasAll(requiredPermissions)) {
    return true;
  }

  return router.createUrlTree([ROUTE_PATHS.HOME]);
};
