import { Routes } from '@angular/router';

export const IAM_ROUTES: Routes = [
  {
    path: 'iam/login',
    data: { title: 'Login' },
    loadComponent: () =>
      import('../pages/login/login-page.component').then(
        (m) => m.LoginPageComponent
      ),
  },
  {
    path: 'iam/register',
    data: { title: 'Register' },
    loadComponent: () =>
      import('../pages/register/register-page.component').then(
        (m) => m.RegisterPageComponent
      ),
  },
  {
    path: 'iam/recover-password',
    data: { title: 'Recover Password' },
    loadComponent: () =>
      import('../pages/recover-password/recover-password-page.component').then(
        (m) => m.RecoverPasswordPageComponent
      ),
  },
  {
    path: 'iam/reset-password',
    data: { title: 'Reset Password' },
    loadComponent: () =>
      import('../pages/reset-password/reset-password-page.component').then(
        (m) => m.ResetPasswordPageComponent
      ),
  },
  {
    path: 'iam/profile',
    redirectTo: 'settings/profile',
    pathMatch: 'full',
  },
];
