import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type DeviceStatus = 'ON' | 'OFF' | 'MAINTENANCE' | 'REMOVED';
export type DeviceType = 'PLUG' | 'LIGHT' | 'SWITCH' | 'SENSOR' | 'OTHER';

export class Device extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _name: string;
  private readonly _room: string;
  private readonly _type: DeviceType;
  private readonly _powerWatts: number;
  private readonly _status: DeviceStatus;
  private readonly _createdAt: string;

  constructor(props: {
    id: number;
    userId: number;
    name: string;
    room?: string | null;
    type: DeviceType;
    powerWatts: number;
    status: DeviceStatus;
    createdAt: string;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._name = props.name;
    this._room = props.room?.trim() ?? '';
    this._type = props.type;
    this._powerWatts = props.powerWatts;
    this._status = props.status;
    this._createdAt = props.createdAt;
  }

  get userId(): number {
    return this._userId;
  }

  get name(): string {
    return this._name;
  }

  get room(): string {
    return this._room;
  }

  get type(): DeviceType {
    return this._type;
  }

  get powerWatts(): number {
    return this._powerWatts;
  }

  get status(): DeviceStatus {
    return this._status;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get isOn(): boolean {
    return this._status === 'ON';
  }

  get isOff(): boolean {
    return this._status === 'OFF';
  }

  get isInMaintenance(): boolean {
    return this._status === 'MAINTENANCE';
  }

  get isRemoved(): boolean {
    return this._status === 'REMOVED';
  }

  get canReceiveOperationalChanges(): boolean {
    return this.isOn || this.isOff;
  }
}
