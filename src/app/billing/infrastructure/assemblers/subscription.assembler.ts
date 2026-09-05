import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { Subscription } from '../../domain/model/subscription.entity';
import { SubscriptionResource } from '../resources/subscription.resource';
import { SubscriptionResponse } from '../responses/subscription.response';

export class SubscriptionAssembler extends BaseAssembler<
  Subscription,
  SubscriptionResource,
  SubscriptionResponse
> {
  override toEntity(response: SubscriptionResponse): Subscription {
    return new Subscription({
      id: response.id,
      userId: response.userId,
      planCode: response.planCode,
      status: response.status,
      active: response.active,
      startDate: response.startDate,
      nextBillingDate: response.nextBillingDate,
      endDate: response.endDate,
    });
  }

  override toResource(entity: Subscription): SubscriptionResource {
    return {
      userId: entity.userId,
      planCode: entity.planCode,
    };
  }
}
