import { BaseEntity } from '../../../shared/domain/model/base.entity';

export class DeviceGroup extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _name: string;
  private readonly _description: string;
  private readonly _deviceIds: number[];
  private readonly _createdAt: string;

  constructor(props: {
    id: number;
    userId: number;
    name: string;
    description?: string | null;
    deviceIds?: number[] | null;
    createdAt?: string | null;
  }) {
    super(props.id);

    this._userId = props.userId;
    this._name = props.name;
    this._description = props.description ?? '';
    this._deviceIds = Array.isArray(props.deviceIds) ? props.deviceIds : [];
    this._createdAt =
      props.createdAt ?? new Date().toISOString().slice(0, 10);
  }

  get userId(): number {
    return this._userId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get deviceIds(): number[] {
    return this._deviceIds;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get deviceCount(): number {
    return this._deviceIds.length;
  }

  get hasDevices(): boolean {
    return this._deviceIds.length > 0;
  }

  containsDevice(deviceId: number): boolean {
    return this._deviceIds.includes(deviceId);
  }
}