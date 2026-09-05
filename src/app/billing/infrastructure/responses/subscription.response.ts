import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import { PlanCode } from '../../domain/model/plan.entity';
import { SubscriptionStatus } from '../../domain/model/subscription.entity';

export interface SubscriptionResponse extends BaseResponse<number> {
  userId: number;
  planCode: PlanCode;
  status: SubscriptionStatus;
  active: boolean;
  startDate?: string | null;
  nextBillingDate?: string | null;
  endDate?: string | null;
}
