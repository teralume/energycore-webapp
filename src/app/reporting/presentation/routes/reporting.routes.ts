import { Routes } from '@angular/router';

import { activeSubscriptionGuard } from '../../../shared/application/guards/active-subscription.guard';
import { accessPermissionGuard } from '../../../shared/application/guards/access-permission.guard';

export const REPORTING_ROUTES: Routes = [
  {
    path: 'energy/reports',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Reportes', requiredPermissions: ['VIEW_REPORTS'] },
    loadComponent: () =>
      import('../pages/reports/reports-page.component').then(
        (m) => m.ReportsPageComponent
      ),
  },
  {
    path: 'energy/goals',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Metas', requiredPermissions: ['VIEW_REPORTS'] },
    loadComponent: () =>
      import('../pages/energy-goals/energy-goals-page.component').then(
        (m) => m.EnergyGoalsPageComponent
      ),
  },
  {
    path: 'reports',
    redirectTo: 'energy/reports',
    pathMatch: 'full',
  },
  {
    path: 'reports/energy-goals',
    redirectTo: 'energy/goals',
    pathMatch: 'full',
  },
];
