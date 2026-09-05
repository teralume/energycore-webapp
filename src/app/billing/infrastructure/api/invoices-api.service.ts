import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { Invoice } from '../../domain/model/invoice.entity';
import { InvoiceAssembler } from '../assemblers/invoice.assembler';
import { InvoiceResource } from '../resources/invoice.resource';
import { InvoiceResponse } from '../responses/invoice.response';

@Injectable({
  providedIn: 'root',
})
export class InvoicesApiService extends BaseApiService<
  Invoice,
  InvoiceResource,
  InvoiceResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'billing/invoices', new InvoiceAssembler());
  }

  findCurrentUserInvoices(): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(
      this.resourceEndpoint
    );
  }
}
