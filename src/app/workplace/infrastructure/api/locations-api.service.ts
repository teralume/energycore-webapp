import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { Location } from '../../domain/model/location.entity';
import { LocationAssembler } from '../assemblers/location.assembler';
import { LocationResource } from '../resources/location.resource';
import { LocationResponse } from '../responses/location.response';

@Injectable({
  providedIn: 'root',
})
export class LocationsApiService extends BaseApiService<
  Location,
  LocationResource,
  LocationResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'workplace/locations', new LocationAssembler());
  }

  findAllForCurrentUser(): Observable<LocationResponse[]> {
    return this.http.get<LocationResponse[]>(this.resourceEndpoint);
  }
}
