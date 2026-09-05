import { Routes } from '@angular/router';

import { activeSubscriptionGuard } from '../../../shared/application/guards/active-subscription.guard';
import { accessPermissionGuard } from '../../../shared/application/guards/access-permission.guard';

export const SERVICE_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'service/support',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Soporte', requiredPermissions: ['MANAGE_SUPPORT'] },
    loadComponent: () =>
      import('../pages/support-tickets/support-tickets-page.component').then(
        (m) => m.SupportTicketsPageComponent
      ),
  },
  {
    path: 'service/maintenance',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Mantenimiento', requiredPermissions: ['MANAGE_SUPPORT'] },
    loadComponent: () =>
      import(
        '../pages/maintenance-tickets/maintenance-tickets-page.component'
        ).then((m) => m.MaintenanceTicketsPageComponent),
  },
  {
    path: 'support-tickets',
    redirectTo: 'service/support',
    pathMatch: 'full',
  },
  {
    path: 'maintenance-tickets',
    redirectTo: 'service/maintenance',
    pathMatch: 'full',
  },
];
