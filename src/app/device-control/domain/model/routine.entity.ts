import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type RoutineAction = 'TURN_ON' | 'TURN_OFF';
export type RoutineTargetType = 'DEVICE' | 'GROUP' | 'ROOM' | 'WORKPLACE';
export type RoutineRepeatType = 'ONCE' | 'DAILY' | 'WEEKLY' | 'CUSTOM_INTERVAL';

export class Routine extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _deviceId: number | null;
  private readonly _groupId: number | null;
  private readonly _targetType: RoutineTargetType;
  private readonly _targetId: number;
  private readonly _targetName: string;
  private readonly _name: string;
  private readonly _action: RoutineAction;
  private readonly _time: string;
  private readonly _repeatType: RoutineRepeatType;
  private readonly _daysOfWeek: string;
  private readonly _intervalDays: number;
  private readonly _startsOn: string | null;
  private readonly _applicableDeviceCount: number;
  private readonly _blockedDeviceCount: number;
  private readonly _enabled: boolean;

  constructor(props: {
    id: number;
    userId: number;
    deviceId?: number | null;
    groupId?: number | null;
    targetType?: RoutineTargetType | null;
    targetId?: number | null;
    targetName?: string | null;
    name: string;
    action: RoutineAction;
    time: string;
    repeatType?: RoutineRepeatType | null;
    daysOfWeek?: string | null;
    intervalDays?: number | null;
    startsOn?: string | null;
    applicableDeviceCount?: number | null;
    blockedDeviceCount?: number | null;
    enabled: boolean;
  }) {
    super(props.id);

    this._userId = props.userId;
    this._deviceId = props.deviceId ?? null;
    this._groupId = props.groupId ?? null;
    this._targetType = props.targetType ?? (props.groupId ? 'GROUP' : 'DEVICE');
    this._targetId = props.targetId ?? props.groupId ?? props.deviceId ?? 0;
    this._targetName = props.targetName ?? '';
    this._name = props.name;
    this._action = props.action;
    this._time = props.time;
    this._repeatType = props.repeatType ?? 'DAILY';
    this._daysOfWeek = props.daysOfWeek ?? '';
    this._intervalDays = props.intervalDays && props.intervalDays > 0 ? props.intervalDays : 1;
    this._startsOn = props.startsOn ?? null;
    this._applicableDeviceCount = props.applicableDeviceCount ?? 0;
    this._blockedDeviceCount = props.blockedDeviceCount ?? 0;
    this._enabled = props.enabled;
  }

  get userId(): number {
    return this._userId;
  }

  get deviceId(): number | null {
    return this._deviceId;
  }

  get groupId(): number | null {
    return this._groupId;
  }

  get targetType(): RoutineTargetType {
    return this._targetType;
  }

  get targetId(): number {
    return this._targetId;
  }

  get targetName(): string {
    return this._targetName;
  }

  get name(): string {
    return this._name;
  }

  get action(): RoutineAction {
    return this._action;
  }

  get time(): string {
    return this._time;
  }

  get repeatType(): RoutineRepeatType {
    return this._repeatType;
  }

  get daysOfWeek(): string {
    return this._daysOfWeek;
  }

  get intervalDays(): number {
    return this._intervalDays;
  }

  get startsOn(): string | null {
    return this._startsOn;
  }

  get applicableDeviceCount(): number {
    return this._applicableDeviceCount;
  }

  get blockedDeviceCount(): number {
    return this._blockedDeviceCount;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get isGroupRoutine(): boolean {
    return this._targetType === 'GROUP';
  }

  get actionLabel(): string {
    return this._action === 'TURN_ON' ? 'Encender' : 'Apagar';
  }

  get targetTypeLabel(): string {
    const labels: Record<RoutineTargetType, string> = {
      DEVICE: 'Dispositivo',
      GROUP: 'Grupo',
      ROOM: 'Habitacion',
      WORKPLACE: 'Sede',
    };

    return labels[this._targetType];
  }

  get repeatLabel(): string {
    if (this._repeatType === 'ONCE') {
      return this._startsOn ? `Una vez - ${this._startsOn}` : 'Una vez';
    }

    if (this._repeatType === 'WEEKLY') {
      return this._daysOfWeek ? `Semanal - ${this._daysOfWeek}` : 'Semanal';
    }

    if (this._repeatType === 'CUSTOM_INTERVAL') {
      return `Cada ${this._intervalDays} dia${this._intervalDays === 1 ? '' : 's'}`;
    }

    return 'Diario';
  }
}
