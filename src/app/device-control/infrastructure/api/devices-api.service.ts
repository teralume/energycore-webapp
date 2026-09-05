import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { Device } from '../../domain/model/device.entity';
import { DeviceAssembler } from '../assemblers/device.assembler';
import { DeviceResource } from '../resources/device.resource';
import { PairDeviceResource } from '../resources/pair-device.resource';
import { UpdateDeviceResource } from '../resources/update-device.resource';
import { DeviceResponse } from '../responses/device.response';

@Injectable({
  providedIn: 'root',
})
export class DevicesApiService extends BaseApiService<
  Device,
  DeviceResource,
  DeviceResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'devices', new DeviceAssembler());
  }

  findAllForCurrentUser(): Observable<DeviceResponse[]> {
    return this.http.get<DeviceResponse[]>(this.resourceEndpoint);
  }

  toggle(payload: {
    deviceId: number;
  }): Observable<DeviceResponse> {
    return this.http.patch<DeviceResponse>(
      `${this.resourceEndpoint}/${payload.deviceId}/toggle`,
      {}
    );
  }

  pair(resource: PairDeviceResource): Observable<DeviceResponse> {
    return this.http.post<DeviceResponse>(
      `${this.resourceEndpoint}/pairings`,
      resource
    );
  }

  updateDetails(payload: {
    deviceId: number;
    resource: UpdateDeviceResource;
  }): Observable<DeviceResponse> {
    return this.http.patch<DeviceResponse>(
      `${this.resourceEndpoint}/${payload.deviceId}`,
      payload.resource
    );
  }

  updateStatus(payload: {
    deviceId: number;
    status: string;
  }): Observable<DeviceResponse> {
    return this.http.patch<DeviceResponse>(
      `${this.resourceEndpoint}/${payload.deviceId}/status`,
      { status: payload.status }
    );
  }
}
