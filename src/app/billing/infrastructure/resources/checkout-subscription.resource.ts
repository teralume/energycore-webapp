import { PlanCode } from '../../domain/model/plan.entity';

export interface CheckoutSubscriptionResource {
  planCode: PlanCode;
  holderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
}
