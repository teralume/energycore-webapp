import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { EnergyGoal } from '../../domain/model/energy-goal.entity';
import { EnergyGoalAssembler } from '../assemblers/energy-goal.assembler';
import { EnergyGoalResource } from '../resources/energy-goal.resource';
import { EnergyGoalResponse } from '../responses/energy-goal.response';

@Injectable({
  providedIn: 'root',
})
export class EnergyGoalsApiService extends BaseApiService<
  EnergyGoal,
  EnergyGoalResource,
  EnergyGoalResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(
      http,
      apiBaseUrl,
      'reports/energy-goals',
      new EnergyGoalAssembler()
    );
  }

  findAllForCurrentUser(): Observable<EnergyGoalResponse[]> {
    return this.http.get<EnergyGoalResponse[]>(this.resourceEndpoint);
  }
}
