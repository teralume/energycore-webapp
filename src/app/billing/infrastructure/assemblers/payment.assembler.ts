import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { Payment } from '../../domain/model/payment.entity';
import { PaymentResource } from '../resources/payment.resource';
import { PaymentResponse } from '../responses/payment.response';

export class PaymentAssembler extends BaseAssembler<
  Payment,
  PaymentResource,
  PaymentResponse
> {
  override toEntity(response: PaymentResponse): Payment {
    return new Payment({
      id: response.id,
      userId: response.userId,
      amount: response.amount,
      currency: response.currency,
      status: response.status,
      paymentMethod: response.paymentMethod,
      gatewayTransactionId: response.gatewayTransactionId,
      gatewayStatusMessage: response.gatewayStatusMessage,
    });
  }

  override toResource(entity: Payment): PaymentResource {
    throw new Error('PaymentResource must be created from payment form data.');
  }
}
