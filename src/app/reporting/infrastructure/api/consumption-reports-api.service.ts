import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { ConsumptionReport } from '../../domain/model/consumption-report.entity';
import { ConsumptionReportAssembler } from '../assemblers/consumption-report.assembler';
import { ConsumptionReportResource } from '../resources/consumption-report.resource';
import { ConsumptionReportResponse } from '../responses/consumption-report.response';

@Injectable({
  providedIn: 'root',
})
export class ConsumptionReportsApiService extends BaseApiService<
  ConsumptionReport,
  ConsumptionReportResource,
  ConsumptionReportResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(
      http,
      apiBaseUrl,
      'reports',
      new ConsumptionReportAssembler()
    );
  }

  findAllForCurrentUser(): Observable<ConsumptionReportResponse[]> {
    return this.http.get<ConsumptionReportResponse[]>(this.resourceEndpoint);
  }
}
