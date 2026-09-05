import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';

export interface PaymentResource extends BaseResource {
  userId: number;
  subscriptionId: number;
  holderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
}