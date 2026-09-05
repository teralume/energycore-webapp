import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { DeviceStatus } from '../../domain/model/device.entity';
import { DeviceGroupResource } from '../resources/device-group.resource';
import { DeviceGroupResponse } from '../responses/device-group.response';

@Injectable({
  providedIn: 'root',
})
export class DeviceGroupsApiService {
  private readonly resourcePath: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.resourcePath = `${apiBaseUrl}/device-groups`;
  }

  findAllForCurrentUser(): Observable<DeviceGroupResponse[]> {
    return this.http.get<DeviceGroupResponse[]>(this.resourcePath);
  }

  create(resource: DeviceGroupResource): Observable<DeviceGroupResponse> {
    return this.http.post<DeviceGroupResponse>(this.resourcePath, resource);
  }

  patch(
    groupId: number,
    resource: Partial<DeviceGroupResource>
  ): Observable<DeviceGroupResponse> {
    return this.http.patch<DeviceGroupResponse>(
      `${this.resourcePath}/${groupId}`,
      resource
    );
  }

  executeAction(payload: {
    groupId: number;
    status: DeviceStatus;
  }): Observable<void> {
    return this.http.patch<void>(
      `${this.resourcePath}/${payload.groupId}/execute`,
      {
        status: payload.status,
      }
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourcePath}/${id}`);
  }
}
