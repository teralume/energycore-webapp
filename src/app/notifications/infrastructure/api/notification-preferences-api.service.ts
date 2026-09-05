import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { NotificationPreference } from '../../domain/model/notification-preference.entity';
import { NotificationPreferenceAssembler } from '../assemblers/notification-preference.assembler';
import { NotificationPreferenceResource } from '../resources/notification-preference.resource';
import { NotificationPreferenceResponse } from '../responses/notification-preference.response';

@Injectable({
  providedIn: 'root',
})
export class NotificationPreferencesApiService extends BaseApiService<
  NotificationPreference,
  NotificationPreferenceResource,
  NotificationPreferenceResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(
      http,
      apiBaseUrl,
      'notifications/preferences',
      new NotificationPreferenceAssembler()
    );
  }

  findCurrent(): Observable<NotificationPreferenceResponse> {
    return this.http.get<NotificationPreferenceResponse>(this.resourceEndpoint);
  }

  save(resource: NotificationPreferenceResource): Observable<NotificationPreferenceResponse> {
    return this.http.put<NotificationPreferenceResponse>(this.resourceEndpoint, resource);
  }
}
