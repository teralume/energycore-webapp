import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { Plan } from '../../domain/model/plan.entity';
import { PlanAssembler } from '../assemblers/plan.assembler';
import { PlanResource } from '../resources/plan.resource';
import { PlanResponse } from '../responses/plan.response';

@Injectable({
  providedIn: 'root',
})
export class PlansApiService extends BaseApiService<
  Plan,
  PlanResource,
  PlanResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'billing/plans', new PlanAssembler());
  }
}