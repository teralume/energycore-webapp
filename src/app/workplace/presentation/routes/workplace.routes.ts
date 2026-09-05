import { Routes } from '@angular/router';

import { activeSubscriptionGuard } from '../../../shared/application/guards/active-subscription.guard';
import { accessPermissionGuard } from '../../../shared/application/guards/access-permission.guard';

export const WORKPLACE_ROUTES: Routes = [
  {
    path: 'spaces/sites',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Sedes', requiredPermissions: ['MANAGE_SPACES'] },
    loadComponent: () =>
      import('../pages/locations/locations-page.component').then(
        (m) => m.LocationsPageComponent
      ),
  },
  {
    path: 'spaces/rooms',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Habitaciones', requiredPermissions: ['MANAGE_SPACES'] },
    loadComponent: () =>
      import('../pages/rooms/rooms-page.component').then(
        (m) => m.RoomsPageComponent
      ),
  },
  {
    path: 'spaces/assignments',
    canActivate: [activeSubscriptionGuard, accessPermissionGuard],
    data: { title: 'Asignaciones', requiredPermissions: ['MANAGE_SPACES'] },
    loadComponent: () =>
      import(
        '../pages/device-assignments/device-assignments-page.component'
        ).then((m) => m.DeviceAssignmentsPageComponent),
  },
  {
    path: 'workplace',
    redirectTo: 'spaces/sites',
    pathMatch: 'full',
  },
  {
    path: 'workplace/locations',
    redirectTo: 'spaces/sites',
    pathMatch: 'full',
  },
  {
    path: 'workplace/rooms',
    redirectTo: 'spaces/rooms',
    pathMatch: 'full',
  },
  {
    path: 'workplace/device-assignments',
    redirectTo: 'spaces/assignments',
    pathMatch: 'full',
  },
];
