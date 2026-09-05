import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { MaintenanceTicket } from '../../domain/model/maintenance-ticket.entity';
import { MaintenanceTicketAssembler } from '../assemblers/maintenance-ticket.assembler';
import { MaintenanceTicketResource } from '../resources/maintenance-ticket.resource';
import { MaintenanceTicketResponse } from '../responses/maintenance-ticket.response';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceTicketsApiService extends BaseApiService<
  MaintenanceTicket,
  MaintenanceTicketResource,
  MaintenanceTicketResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(
      http,
      apiBaseUrl,
      'maintenance-tickets',
      new MaintenanceTicketAssembler()
    );
  }

  findAllForCurrentUser(): Observable<MaintenanceTicketResponse[]> {
    return this.http.get<MaintenanceTicketResponse[]>(this.resourceEndpoint);
  }

  updateStatus(
    ticketId: number,
    resource: Partial<MaintenanceTicketResource>
  ): Observable<MaintenanceTicketResponse> {
    return this.http.patch<MaintenanceTicketResponse>(
      `${this.resourceEndpoint}/${ticketId}/status`,
      resource
    );
  }
}
