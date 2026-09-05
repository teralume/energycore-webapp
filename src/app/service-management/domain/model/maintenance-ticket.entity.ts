import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type MaintenanceTicketStatus = 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELED';
export type MaintenanceTicketType = 'INSPECTION' | 'REPAIR' | 'REPLACEMENT' | 'INSTALLATION';

export class MaintenanceTicket extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _deviceId: number;
  private readonly _deviceName: string;
  private readonly _type: MaintenanceTicketType;
  private readonly _description: string;
  private readonly _scheduledDate: string;
  private readonly _status: MaintenanceTicketStatus;
  private readonly _createdAt: string;

  constructor(props: {
    id: number;
    userId: number;
    deviceId: number;
    deviceName: string;
    type: MaintenanceTicketType;
    description: string;
    scheduledDate: string;
    status: MaintenanceTicketStatus;
    createdAt: string;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._deviceId = props.deviceId;
    this._deviceName = props.deviceName;
    this._type = props.type;
    this._description = props.description;
    this._scheduledDate = props.scheduledDate;
    this._status = props.status;
    this._createdAt = props.createdAt;
  }

  get userId(): number {
    return this._userId;
  }

  get deviceId(): number {
    return this._deviceId;
  }

  get deviceName(): string {
    return this._deviceName;
  }

  get type(): MaintenanceTicketType {
    return this._type;
  }

  get description(): string {
    return this._description;
  }

  get scheduledDate(): string {
    return this._scheduledDate;
  }

  get status(): MaintenanceTicketStatus {
    return this._status;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get isPending(): boolean {
    return this._status === 'PENDING';
  }

  get isScheduled(): boolean {
    return this._status === 'SCHEDULED';
  }

  get isCompleted(): boolean {
    return this._status === 'COMPLETED';
  }

  get isCanceled(): boolean {
    return this._status === 'CANCELED';
  }
}