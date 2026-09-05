import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type PaymentMethod = 'CARD';
export type PaymentStatus = 'APPROVED' | 'REJECTED' | 'PENDING';

export class Payment extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _amount: number;
  private readonly _currency: string;
  private readonly _status: PaymentStatus;
  private readonly _paymentMethod: string;
  private readonly _gatewayTransactionId: string | null;
  private readonly _gatewayStatusMessage: string | null;

  constructor(props: {
    id: number;
    userId: number;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paymentMethod: string;
    gatewayTransactionId?: string | null;
    gatewayStatusMessage?: string | null;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._amount = props.amount;
    this._currency = props.currency;
    this._status = props.status;
    this._paymentMethod = props.paymentMethod;
    this._gatewayTransactionId = props.gatewayTransactionId ?? null;
    this._gatewayStatusMessage = props.gatewayStatusMessage ?? null;
  }

  get userId(): number {
    return this._userId;
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get status(): PaymentStatus {
    return this._status;
  }

  get paymentMethod(): string {
    return this._paymentMethod;
  }

  get gatewayTransactionId(): string | null {
    return this._gatewayTransactionId;
  }

  get gatewayStatusMessage(): string | null {
    return this._gatewayStatusMessage;
  }

  get isApproved(): boolean {
    return this._status === 'APPROVED';
  }
}
