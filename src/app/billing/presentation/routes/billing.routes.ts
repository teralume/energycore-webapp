import { Routes } from '@angular/router';

import { authGuard } from '../../../shared/application/guards/auth.guard';
import { accessPermissionGuard } from '../../../shared/application/guards/access-permission.guard';

export const BILLING_ROUTES: Routes = [
  {
    path: 'plans',
    canActivate: [authGuard, accessPermissionGuard],
    data: { title: 'Planes', requiredPermissions: ['MANAGE_BILLING'] },
    loadComponent: () =>
      import('../pages/plans/plans-page.component').then(
        (m) => m.PlansPageComponent
      ),
  },
  {
    path: 'billing/history',
    redirectTo: 'settings/billing',
    pathMatch: 'full',
  },
];
