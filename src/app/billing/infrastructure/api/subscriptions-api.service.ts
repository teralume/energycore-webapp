import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { Subscription } from '../../domain/model/subscription.entity';
import { SubscriptionAssembler } from '../assemblers/subscription.assembler';
import { CheckoutSubscriptionResource } from '../resources/checkout-subscription.resource';
import { SubscriptionResource } from '../resources/subscription.resource';
import { SubscriptionResponse } from '../responses/subscription.response';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionsApiService extends BaseApiService<
  Subscription,
  SubscriptionResource,
  SubscriptionResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'billing/subscriptions', new SubscriptionAssembler());
  }

  findCurrent(): Observable<SubscriptionResponse | null> {
    return this.http.get<SubscriptionResponse | null>(
      `${this.resourceEndpoint}/current`
    );
  }

  cancelCurrent(): Observable<void> {
    return this.http.delete<void>(
      `${this.resourceEndpoint}/current`
    );
  }

  checkout(resource: CheckoutSubscriptionResource): Observable<SubscriptionResponse> {
    return this.http.post<SubscriptionResponse>(
      `${this.resourceEndpoint}/checkout`,
      resource
    );
  }
}
