import { Routes } from '@angular/router';

import { BILLING_ROUTES } from './billing/presentation/routes/billing.routes';
import { DEVICE_CONTROL_ROUTES } from './device-control/presentation/routes/device-control.routes';
import { ENERGY_MONITORING_ROUTES } from './energy-monitoring/presentation/routes/energy-monitoring.routes';
import { IAM_ROUTES } from './iam/presentation/routes/iam.routes';
import { NOTIFICATIONS_ROUTES } from './notifications/presentation/routes/notifications.routes';
import { REPORTING_ROUTES } from './reporting/presentation/routes/reporting.routes';
import { SERVICE_MANAGEMENT_ROUTES } from './service-management/presentation/routes/service-management.routes';
import { activeSubscriptionGuard } from './shared/application/guards/active-subscription.guard';
import { accessPermissionGuard } from './shared/application/guards/access-permission.guard';
import { authGuard } from './shared/application/guards/auth.guard';
import { WORKPLACE_ROUTES } from './workplace/presentation/routes/workplace.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'iam/login',
    pathMatch: 'full',
  },

  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './shared/presentation/components/settings-shell/settings-shell.component'
      ).then((m) => m.SettingsShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full',
      },
      {
        path: 'profile',
        data: { title: 'Perfil' },
        loadComponent: () =>
          import('./iam/presentation/pages/profile/profile-page.component').then(
            (m) => m.ProfilePageComponent
          ),
      },
      {
        path: 'account',
        data: { title: 'Cuenta' },
        loadComponent: () =>
          import('./iam/presentation/pages/account/account-page.component').then(
            (m) => m.AccountPageComponent
          ),
      },
      {
        path: 'security',
        data: { title: 'Seguridad' },
        loadComponent: () =>
          import('./iam/presentation/pages/security/security-page.component').then(
            (m) => m.SecurityPageComponent
          ),
      },
      {
        path: 'notifications',
        redirectTo: '/alerts/preferences',
        pathMatch: 'full',
      },
      {
        path: 'billing',
        canActivate: [accessPermissionGuard],
        data: {
          title: 'Facturacion',
          requiredPermissions: ['MANAGE_BILLING'],
        },
        loadComponent: () =>
          import(
            './billing/presentation/pages/billing-history/billing-history-page.component'
          ).then((m) => m.BillingHistoryPageComponent),
      },
      {
        path: 'access',
        canActivate: [accessPermissionGuard],
        data: {
          title: 'Accesos',
          requiredPermissions: ['MANAGE_ACCESS'],
        },
        loadComponent: () =>
          import('./iam/presentation/pages/access/access-page.component').then(
            (m) => m.AccessPageComponent
          ),
      },
      {
        path: 'platform',
        data: { title: 'Plataforma' },
        loadComponent: () =>
          import('./iam/presentation/pages/platform/platform-page.component').then(
            (m) => m.PlatformPageComponent
          ),
      },
    ],
  },

  ...IAM_ROUTES,
  ...BILLING_ROUTES,
  ...DEVICE_CONTROL_ROUTES,
  ...ENERGY_MONITORING_ROUTES,
  ...NOTIFICATIONS_ROUTES,
  ...WORKPLACE_ROUTES,
  ...REPORTING_ROUTES,
  ...SERVICE_MANAGEMENT_ROUTES,

  {
    path: 'home',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Home' },
    loadComponent: () =>
      import('./shared/presentation/pages/home/home-page.component').then(
        (m) => m.HomePageComponent
      ),
  },
  {
    path: 'about',
    data: { title: 'About' },
    loadComponent: () =>
      import('./shared/presentation/pages/about/about-page.component').then(
        (m) => m.AboutPageComponent
      ),
  },
  {
    path: '**',
    canActivate: [authGuard],
    data: { title: 'Page Not Found' },
    loadComponent: () =>
      import(
        './shared/presentation/pages/not-found/not-found-page.component'
        ).then((m) => m.NotFoundPageComponent),
  },
];
