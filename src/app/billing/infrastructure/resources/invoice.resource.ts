import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';

export interface InvoiceResource extends BaseResource {
  userId: number;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  issuedAt: string;
}
