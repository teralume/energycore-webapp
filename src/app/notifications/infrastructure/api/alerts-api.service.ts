import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { Alert } from '../../domain/model/alert.entity';
import { AlertAssembler } from '../assemblers/alert.assembler';
import { AlertResource } from '../resources/alert.resource';
import { AlertResponse } from '../responses/alert.response';

@Injectable({
  providedIn: 'root',
})
export class AlertsApiService extends BaseApiService<
  Alert,
  AlertResource,
  AlertResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'alerts', new AlertAssembler());
  }

  findAllForCurrentUser(): Observable<AlertResponse[]> {
    return this.http.get<AlertResponse[]>(this.resourceEndpoint);
  }

  createAlert(resource: AlertResource): Observable<AlertResponse> {
    const {
      title,
      message,
      level,
      sourceType,
      sourceId,
      sourceLabel,
      eventType,
      threadKey,
      evidence,
      explanation,
      recommendedAction,
      severityScore,
      expiresAt,
    } = resource;

    return this.http.post<AlertResponse>(this.resourceEndpoint, {
      title,
      message,
      level,
      sourceType,
      sourceId,
      sourceLabel,
      eventType,
      threadKey,
      evidence,
      explanation,
      recommendedAction,
      severityScore,
      expiresAt,
    });
  }

  markAsRead(alertId: number): Observable<AlertResponse> {
    return this.http.patch<AlertResponse>(
      `${this.resourceEndpoint}/${alertId}/read`,
      {}
    );
  }

  dismiss(alertId: number, minutes = 10): Observable<AlertResponse> {
    return this.http.patch<AlertResponse>(
      `${this.resourceEndpoint}/${alertId}/dismiss?minutes=${minutes}`,
      {}
    );
  }

  resolve(alertId: number): Observable<AlertResponse> {
    return this.http.patch<AlertResponse>(
      `${this.resourceEndpoint}/${alertId}/resolve`,
      {}
    );
  }
}
