import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { DeviceAssignment } from '../../domain/model/device-assignment.entity';
import { DeviceAssignmentAssembler } from '../assemblers/device-assignment.assembler';
import { DeviceAssignmentResource } from '../resources/device-assignment.resource';
import { DeviceAssignmentResponse } from '../responses/device-assignment.response';

@Injectable({
  providedIn: 'root',
})
export class DeviceAssignmentsApiService extends BaseApiService<
  DeviceAssignment,
  DeviceAssignmentResource,
  DeviceAssignmentResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'workplace/device-assignments', new DeviceAssignmentAssembler());
  }

  findAllForCurrentUser(): Observable<DeviceAssignmentResponse[]> {
    return this.http.get<DeviceAssignmentResponse[]>(this.resourceEndpoint);
  }

  findByDeviceId(deviceId: number): Observable<DeviceAssignmentResponse[]> {
    return this.http.get<DeviceAssignmentResponse[]>(`${this.resourceEndpoint}?deviceId=${deviceId}`);
  }
}
