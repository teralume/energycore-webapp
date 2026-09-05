import { BaseEntity } from '../../../shared/domain/model/base.entity';

export class DeviceAssignment extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _deviceId: number;
  private readonly _locationId: number;
  private readonly _roomId: number | null;
  private readonly _assignedAt: string;

  constructor(props: {
    id: number;
    userId: number;
    deviceId: number;
    locationId: number;
    roomId?: number | null;
    assignedAt: string;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._deviceId = props.deviceId;
    this._locationId = props.locationId;
    this._roomId = props.roomId ?? null;
    this._assignedAt = props.assignedAt;
  }

  get userId(): number {
    return this._userId;
  }

  get deviceId(): number {
    return this._deviceId;
  }

  get locationId(): number {
    return this._locationId;
  }

  get roomId(): number | null {
    return this._roomId;
  }

  get hasRoom(): boolean {
    return this._roomId !== null;
  }

  get assignedAt(): string {
    return this._assignedAt;
  }
}
