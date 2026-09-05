import { PlanCode } from '../../domain/model/plan.entity';

export interface PaymentFormCommand {
  planCode: PlanCode;
  holderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
}
