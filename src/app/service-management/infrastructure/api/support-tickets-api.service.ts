import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { SupportTicket } from '../../domain/model/support-ticket.entity';
import { SupportTicketAssembler } from '../assemblers/support-ticket.assembler';
import { SupportTicketResource } from '../resources/support-ticket.resource';
import { SupportTicketResponse } from '../responses/support-ticket.response';

@Injectable({
  providedIn: 'root',
})
export class SupportTicketsApiService extends BaseApiService<
  SupportTicket,
  SupportTicketResource,
  SupportTicketResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'support-tickets', new SupportTicketAssembler());
  }

  findAllForCurrentUser(): Observable<SupportTicketResponse[]> {
    return this.http.get<SupportTicketResponse[]>(this.resourceEndpoint);
  }

  updateStatus(
    ticketId: number,
    resource: Partial<SupportTicketResource>
  ): Observable<SupportTicketResponse> {
    return this.http.patch<SupportTicketResponse>(
      `${this.resourceEndpoint}/${ticketId}/status`,
      resource
    );
  }
}
