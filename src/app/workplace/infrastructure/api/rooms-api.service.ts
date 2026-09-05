import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { Room } from '../../domain/model/room.entity';
import { RoomAssembler } from '../assemblers/room.assembler';
import { RoomResource } from '../resources/room.resource';
import { RoomResponse } from '../responses/room.response';

@Injectable({
  providedIn: 'root',
})
export class RoomsApiService extends BaseApiService<
  Room,
  RoomResource,
  RoomResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'workplace/rooms', new RoomAssembler());
  }

  findAllForCurrentUser(): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(this.resourceEndpoint);
  }

  findByLocationId(locationId: number): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(`${this.resourceEndpoint}?locationId=${locationId}`);
  }
}
