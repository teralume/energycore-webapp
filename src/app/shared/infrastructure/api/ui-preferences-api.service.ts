import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-config';
import type { AppTheme } from '../../application/services/ui-preferences.service';

type LanguageCode = 'es' | 'en' | 'pt';

export interface UiPreferenceResponse {
  id: number;
  userId: number;
  language: LanguageCode;
  theme: AppTheme;
}

export interface UpdateUiPreferenceResource {
  language: LanguageCode;
  theme: AppTheme;
}

@Injectable({
  providedIn: 'root',
})
export class UiPreferencesApiService {
  private readonly endpoint: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.endpoint = `${apiBaseUrl}/users/me/ui-preferences`;
  }

  getCurrent(): Observable<UiPreferenceResponse> {
    return this.http.get<UiPreferenceResponse>(this.endpoint);
  }

  save(resource: UpdateUiPreferenceResource): Observable<UiPreferenceResponse> {
    return this.http.put<UiPreferenceResponse>(this.endpoint, resource);
  }
}
