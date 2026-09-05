import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import { PaymentStatus } from '../../domain/model/payment.entity';

export interface PaymentResponse extends BaseResponse<number> {
  userId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  gatewayTransactionId?: string | null;
  gatewayStatusMessage?: string | null;
}
