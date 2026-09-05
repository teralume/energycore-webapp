import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type EnergyReadingStatus = 'NORMAL' | 'HIGH';

export class EnergyReading extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _deviceId: number;
  private readonly _deviceName: string;
  private readonly _watts: number;
  private readonly _kilowattHours: number;
  private readonly _estimatedCost: number;
  private readonly _sampleSeconds: number;
  private readonly _recordedAt: string;
  private readonly _status: EnergyReadingStatus;

  constructor(props: {
    id: number;
    userId: number;
    deviceId: number;
    deviceName: string;
    watts: number;
    kilowattHours?: number;
    estimatedCost?: number;
    sampleSeconds?: number;
    recordedAt: string;
    status: EnergyReadingStatus;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._deviceId = props.deviceId;
    this._deviceName = props.deviceName;
    this._watts = props.watts;
    this._kilowattHours = props.kilowattHours ?? 0;
    this._estimatedCost = props.estimatedCost ?? 0;
    this._sampleSeconds = props.sampleSeconds ?? 0;
    this._recordedAt = props.recordedAt;
    this._status = props.status;
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

  get watts(): number {
    return this._watts;
  }

  get kilowattHours(): number {
    return this._kilowattHours;
  }

  get estimatedCost(): number {
    return this._estimatedCost;
  }

  get sampleSeconds(): number {
    return this._sampleSeconds;
  }

  get recordedAt(): string {
    return this._recordedAt;
  }

  get status(): EnergyReadingStatus {
    return this._status;
  }

  get isHigh(): boolean {
    return this._status === 'HIGH';
  }

  get isNormal(): boolean {
    return this._status === 'NORMAL';
  }
}