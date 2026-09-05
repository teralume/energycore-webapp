import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';
import { AlertRuleProfile } from '../../domain/model/alert-rule-profile.entity';
import { AlertRuleProfileResource } from '../resources/alert-rule-profile.resource';
import { AlertRuleProfileResponse } from '../responses/alert-rule-profile.response';

@Injectable({
  providedIn: 'root',
})
export class AlertRuleProfilesApiService extends BaseApiService<
  AlertRuleProfile,
  AlertRuleProfileResource,
  AlertRuleProfileResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'alerts/rule-profiles', {
      toEntity: (response: AlertRuleProfileResponse) => new AlertRuleProfile({
        id: response.id,
        userId: response.userId,
        name: response.name,
        description: response.description,
        scopeType: response.scopeType,
        scopeId: response.scopeId ?? null,
        mode: response.mode,
        sensitivity: response.sensitivity,
        active: response.active,
      }),
      toResource: (entity: AlertRuleProfile) => ({
        name: entity.name,
        description: entity.description,
        scopeType: entity.scopeType,
        scopeId: entity.scopeId,
        mode: entity.mode,
        sensitivity: entity.sensitivity,
      }),
    });
  }

  findAllForCurrentUser(): Observable<AlertRuleProfileResponse[]> {
    return this.http.get<AlertRuleProfileResponse[]>(this.resourceEndpoint);
  }

  activate(profileId: number): Observable<AlertRuleProfileResponse> {
    return this.http.patch<AlertRuleProfileResponse>(
      `${this.resourceEndpoint}/${profileId}/activate`,
      {}
    );
  }
}
