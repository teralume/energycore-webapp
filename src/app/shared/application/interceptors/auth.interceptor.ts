// src/app/shared/application/interceptors/auth.interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthSessionService } from '../services/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authSession = inject(AuthSessionService);

  if (authSession.isSessionExpired()) {
    authSession.clearSession();
  }

  const token = authSession.token();

  const authenticatedRequest = request.clone({
    withCredentials: true,
    ...(token
      ? {
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {}),
  });

  return next(authenticatedRequest);
};
