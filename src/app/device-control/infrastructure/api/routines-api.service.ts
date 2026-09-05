import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { RoutineResource } from '../resources/routine.resource';
import { RoutineResponse } from '../responses/routine.response';

@Injectable({
  providedIn: 'root',
})
export class RoutinesApiService {
  private readonly resourcePath: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.resourcePath = `${apiBaseUrl}/routines`;
  }

  findAllForCurrentUser(): Observable<RoutineResponse[]> {
    return this.http.get<RoutineResponse[]>(this.resourcePath);
  }

  create(resource: RoutineResource): Observable<RoutineResponse> {
    return this.http.post<RoutineResponse>(this.resourcePath, resource);
  }

  updateStatus(payload: {
    routineId: number;
    enabled: boolean;
  }): Observable<RoutineResponse> {
    return this.http.patch<RoutineResponse>(
      `${this.resourcePath}/${payload.routineId}/status`,
      {
        enabled: payload.enabled,
      }
    );
  }

  execute(routineId: number): Observable<RoutineResponse> {
    return this.http.patch<RoutineResponse>(
      `${this.resourcePath}/${routineId}/execute`,
      {}
    );
  }

  delete(routineId: number): Observable<void> {
    return this.http.delete<void>(`${this.resourcePath}/${routineId}`);
  }
}
