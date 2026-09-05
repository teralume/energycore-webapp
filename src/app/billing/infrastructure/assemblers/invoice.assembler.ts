import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { Invoice } from '../../domain/model/invoice.entity';
import { InvoiceResource } from '../resources/invoice.resource';
import { InvoiceResponse } from '../responses/invoice.response';

export class InvoiceAssembler extends BaseAssembler<
  Invoice,
  InvoiceResource,
  InvoiceResponse
> {
  override toEntity(response: InvoiceResponse): Invoice {
    return new Invoice({
      id: response.id,
      userId: response.userId,
      invoiceNumber: response.invoiceNumber,
      totalAmount: response.totalAmount,
      currency: response.currency,
      issuedAt: response.issuedAt,
    });
  }

  override toResource(entity: Invoice): InvoiceResource {
    return {
      userId: entity.userId,
      invoiceNumber: entity.invoiceNumber,
      totalAmount: entity.totalAmount,
      currency: entity.currency,
      issuedAt: entity.issuedAt,
    };
  }
}
