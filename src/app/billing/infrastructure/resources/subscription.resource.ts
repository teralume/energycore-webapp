import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import { PlanCode } from '../../domain/model/plan.entity';

export interface SubscriptionResource extends BaseResource {
  userId: number;
  planCode: PlanCode;
}