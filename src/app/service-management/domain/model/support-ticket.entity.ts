import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export class SupportTicket extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _subject: string;
  private readonly _description: string;
  private readonly _priority: SupportTicketPriority;
  private readonly _status: SupportTicketStatus;
  private readonly _createdAt: string;

  constructor(props: {
    id: number;
    userId: number;
    subject: string;
    description: string;
    priority: SupportTicketPriority;
    status: SupportTicketStatus;
    createdAt: string;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._subject = props.subject;
    this._description = props.description;
    this._priority = props.priority;
    this._status = props.status;
    this._createdAt = props.createdAt;
  }

  get userId(): number {
    return this._userId;
  }

  get subject(): string {
    return this._subject;
  }

  get description(): string {
    return this._description;
  }

  get priority(): SupportTicketPriority {
    return this._priority;
  }

  get status(): SupportTicketStatus {
    return this._status;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get isOpen(): boolean {
    return this._status === 'OPEN';
  }

  get isInProgress(): boolean {
    return this._status === 'IN_PROGRESS';
  }

  get isResolved(): boolean {
    return this._status === 'RESOLVED';
  }

  get isClosed(): boolean {
    return this._status === 'CLOSED';
  }

  get isUrgent(): boolean {
    return this._priority === 'URGENT';
  }
}