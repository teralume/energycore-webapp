import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';

import { SignInResource } from '../resources/sign-in.resource';
import { SignUpResource } from '../resources/sign-up.resource';
import { ResetPasswordResource } from '../resources/reset-password.resource';
import { AuthResponse } from '../responses/auth.response';
import { UserResponse } from '../responses/user.response';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly authUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string
  ) {
    this.authUrl = `${this.apiBaseUrl}/auth`;
  }

  signIn(resource: SignInResource): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/sign-in`, resource);
  }

  signUp(resource: SignUpResource): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/sign-up`, resource);
  }

  signOut(): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/sign-out`, {});
  }

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.authUrl}/me`);
  }

  recoverPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/recover-password`, { email });
  }

  resetPassword(resource: ResetPasswordResource): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/reset-password`, resource);
  }
}
