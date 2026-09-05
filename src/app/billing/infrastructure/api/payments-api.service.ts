import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { Payment } from '../../domain/model/payment.entity';
import { PaymentAssembler } from '../assemblers/payment.assembler';
import { PaymentResource } from '../resources/payment.resource';
import { PaymentResponse } from '../responses/payment.response';

@Injectable({
  providedIn: 'root',
})
export class PaymentsApiService extends BaseApiService<
  Payment,
  PaymentResource,
  PaymentResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'billing/payments', new PaymentAssembler());
  }

  findCurrentUserPayments(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(
      this.resourceEndpoint
    );
  }
}
