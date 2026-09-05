import { BaseEntity } from '../../../shared/domain/model/base.entity';

export class Invoice extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _invoiceNumber: string;
  private readonly _totalAmount: number;
  private readonly _currency: string;
  private readonly _issuedAt: string;

  constructor(props: {
    id: number;
    userId: number;
    invoiceNumber: string;
    totalAmount: number;
    currency: string;
    issuedAt: string;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._invoiceNumber = props.invoiceNumber;
    this._totalAmount = props.totalAmount;
    this._currency = props.currency;
    this._issuedAt = props.issuedAt;
  }

  get userId(): number {
    return this._userId;
  }

  get invoiceNumber(): string {
    return this._invoiceNumber;
  }

  get totalAmount(): number {
    return this._totalAmount;
  }

  get currency(): string {
    return this._currency;
  }

  get issuedAt(): string {
    return this._issuedAt;
  }
}
