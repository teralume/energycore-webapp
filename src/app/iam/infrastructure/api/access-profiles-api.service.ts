import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { AccessProfile } from '../../domain/model/access-profile.entity';
import { AccessProfileAssembler } from '../assemblers/access-profile.assembler';
import { AccessProfileResource } from '../resources/access-profile.resource';
import { AccessProfileResponse } from '../responses/access-profile.response';

@Injectable({
  providedIn: 'root',
})
export class AccessProfilesApiService extends BaseApiService<
  AccessProfile,
  AccessProfileResource,
  AccessProfileResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'access-profiles', new AccessProfileAssembler());
  }

  findAllProfiles(): Observable<AccessProfileResponse[]> {
    return this.http.get<AccessProfileResponse[]>(this.resourceEndpoint);
  }
}
