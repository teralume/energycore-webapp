import { Routes } from '@angular/router';

import { activeSubscriptionGuard } from '../../../shared/application/guards/active-subscription.guard';
import { accessPermissionGuard } from '../../../shared/application/guards/access-permission.guard';

export const ENERGY_MONITORING_ROUTES: Routes = [
  {
    path: 'energy/consumption',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Consumo', requiredPermissions: ['VIEW_ENERGY'] },
    loadComponent: () =>
      import('../pages/energy-dashboard/energy-dashboard-page.component').then(
        (m) => m.EnergyDashboardPageComponent
      ),
  },
  {
    path: 'energy',
    redirectTo: 'energy/consumption',
    pathMatch: 'full',
  },
  {
    path: 'energy/history',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Historial', requiredPermissions: ['VIEW_ENERGY'] },
    loadComponent: () =>
      import('../pages/energy-history/energy-history-page.component').then(
        (m) => m.EnergyHistoryPageComponent
      ),
  },
];
