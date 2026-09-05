import { Routes } from '@angular/router';

import { activeSubscriptionGuard } from '../../../shared/application/guards/active-subscription.guard';
import { accessPermissionGuard } from '../../../shared/application/guards/access-permission.guard';

export const DEVICE_CONTROL_ROUTES: Routes = [
  {
    path: 'operation/devices',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Dispositivos', requiredPermissions: ['CONTROL_DEVICES'] },
    loadComponent: () =>
      import('../pages/devices/devices-page.component').then(
        (m) => m.DevicesPageComponent
      ),
  },
  {
    path: 'operation/groups',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Grupos', requiredPermissions: ['MANAGE_ROUTINES'] },
    loadComponent: () =>
      import('../pages/device-groups/device-groups-page.component').then(
        (m) => m.DeviceGroupsPageComponent
      ),
  },
  {
    path: 'operation/routines',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Rutinas', requiredPermissions: ['MANAGE_ROUTINES'] },
    loadComponent: () =>
      import('../pages/routines/routines-page.component').then(
        (m) => m.RoutinesPageComponent
      ),
  },
  {
    path: 'operation/modes',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Modos', requiredPermissions: ['MANAGE_ROUTINES'] },
    loadComponent: () =>
      import('../pages/operation-modes/operation-modes-page.component').then(
        (m) => m.OperationModesPageComponent
      ),
  },
  {
    path: 'operation',
    redirectTo: 'operation/devices',
    pathMatch: 'full',
  },
  {
    path: 'devices',
    redirectTo: 'operation/devices',
    pathMatch: 'full',
  },
  {
    path: 'routines',
    redirectTo: 'operation/routines',
    pathMatch: 'full',
  },
  {
    path: 'operation-modes',
    redirectTo: 'operation/modes',
    pathMatch: 'full',
  },
  {
    path: 'device-groups',
    redirectTo: 'operation/groups',
    pathMatch: 'full',
  },
];
