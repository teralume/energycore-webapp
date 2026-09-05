import { BaseEntity } from '../../../shared/domain/model/base.entity';
import { PlanCode } from './plan.entity';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export class Subscription extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _planCode: PlanCode;
  private readonly _status: SubscriptionStatus;
  private readonly _active: boolean;
  private readonly _startDate: string | null;
  private readonly _nextBillingDate: string | null;
  private readonly _endDate: string | null;

  constructor(props: {
    id: number;
    userId: number;
    planCode: PlanCode;
    status: SubscriptionStatus;
    active: boolean;
    startDate?: string | null;
    nextBillingDate?: string | null;
    endDate?: string | null;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._planCode = props.planCode;
    this._status = props.status;
    this._active = props.active;
    this._startDate = props.startDate ?? null;
    this._nextBillingDate = props.nextBillingDate ?? null;
    this._endDate = props.endDate ?? null;
  }

  get userId(): number {
    return this._userId;
  }

  get planCode(): PlanCode {
    return this._planCode;
  }

  get status(): SubscriptionStatus {
    return this._status;
  }

  get active(): boolean {
    return this._active;
  }

  get isActive(): boolean {
    return this._active;
  }

  get startDate(): string | null {
    return this._startDate;
  }

  get nextBillingDate(): string | null {
    return this._nextBillingDate;
  }

  get endDate(): string | null {
    return this._endDate;
  }
}
