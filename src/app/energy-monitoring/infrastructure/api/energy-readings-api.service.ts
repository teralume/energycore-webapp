import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { EnergyReading } from '../../domain/model/energy-reading.entity';
import { EnergyReadingAssembler } from '../assemblers/energy-reading.assembler';
import { EnergyReadingResource } from '../resources/energy-reading.resource';
import { EnergyDashboardSummaryResponse } from '../responses/energy-dashboard-summary.response';
import { EnergyReadingResponse } from '../responses/energy-reading.response';
import { EnergySamplingSettingsResponse } from '../responses/energy-sampling-settings.response';

@Injectable({
  providedIn: 'root',
})
export class EnergyReadingsApiService extends BaseApiService<
  EnergyReading,
  EnergyReadingResource,
  EnergyReadingResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'energy-readings', new EnergyReadingAssembler());
  }

  findAllForCurrentUser(): Observable<EnergyReadingResponse[]> {
    return this.http.get<EnergyReadingResponse[]>(this.resourceEndpoint);
  }

  getDashboardSummary(): Observable<EnergyDashboardSummaryResponse> {
    return this.http.get<EnergyDashboardSummaryResponse>(
      `${this.resourceEndpoint}/dashboard-summary`
    );
  }

  getSamplingSettings(): Observable<EnergySamplingSettingsResponse> {
    return this.http.get<EnergySamplingSettingsResponse>(
      `${this.resourceEndpoint}/sampling-settings`
    );
  }

  updateSamplingSettings(sampleSeconds: number): Observable<EnergySamplingSettingsResponse> {
    return this.http.patch<EnergySamplingSettingsResponse>(
      `${this.resourceEndpoint}/sampling-settings`,
      { sampleSeconds }
    );
  }

  findCurrentUserByDateRange(
    startDate: string,
    endDate: string
  ): Observable<EnergyReadingResponse[]> {
    return this.http.get<EnergyReadingResponse[]>(`${this.resourceEndpoint}?recordedAt_gte=${startDate}&recordedAt_lte=${endDate}`);
  }
}
