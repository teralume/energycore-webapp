import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { ReportingEvent } from '../../domain/model/reporting-event.entity';
import { ReportingEventAssembler } from '../assemblers/reporting-event.assembler';
import { ReportingEventResource } from '../resources/reporting-event.resource';
import { ReportingEventResponse } from '../responses/reporting-event.response';

@Injectable({
  providedIn: 'root',
})
export class ReportingEventsApiService extends BaseApiService<
  ReportingEvent,
  ReportingEventResource,
  ReportingEventResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(
      http,
      apiBaseUrl,
      'reports/activity',
      new ReportingEventAssembler()
    );
  }

  findAllForCurrentUser(): Observable<ReportingEventResponse[]> {
    return this.http.get<ReportingEventResponse[]>(this.resourceEndpoint);
  }
}
