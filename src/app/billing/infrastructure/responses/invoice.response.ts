import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';

export interface InvoiceResponse extends BaseResponse<number> {
  userId: number;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  issuedAt: string;
}
