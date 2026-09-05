import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { OperationModeResource } from '../resources/operation-mode.resource';
import {
  OperationModeActivationResponse,
  OperationModePreviewResponse,
  OperationModeResponse,
} from '../responses/operation-mode.response';

@Injectable({
  providedIn: 'root',
})
export class OperationModesApiService {
  private readonly endpoint: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.endpoint = `${apiBaseUrl}/operation-modes`;
  }

  findAllForCurrentUser(): Observable<OperationModeResponse[]> {
    return this.http.get<OperationModeResponse[]>(this.endpoint);
  }

  create(resource: OperationModeResource): Observable<OperationModeResponse> {
    return this.http.post<OperationModeResponse>(this.endpoint, resource);
  }

  preview(modeId: number): Observable<OperationModePreviewResponse> {
    return this.http.get<OperationModePreviewResponse>(`${this.endpoint}/${modeId}/preview`);
  }

  activate(modeId: number): Observable<OperationModeActivationResponse> {
    return this.http.patch<OperationModeActivationResponse>(`${this.endpoint}/${modeId}/activate`, {});
  }

  archive(modeId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${modeId}`);
  }
}
