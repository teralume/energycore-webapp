import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type OperationModeStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type OperationModeRoutineTargetType = 'DEVICE' | 'GROUP';
export type OperationModeRoutineAction = 'TURN_ON' | 'TURN_OFF';

export interface OperationModeRoutine {
  name: string;
  targetType: OperationModeRoutineTargetType;
  targetId: number;
  action: OperationModeRoutineAction;
  triggerTime: string;
  enabled: boolean;
}

export class OperationMode extends BaseEntity<number> {
  constructor(
    private readonly props: {
      id: number;
      userId: number;
      locationId: number;
      name: string;
      description: string;
      status: OperationModeStatus;
      roomIds: number[];
      groupIds: number[];
      deviceIds: number[];
      turnOnDeviceIds: number[];
      turnOffDeviceIds: number[];
      keepOnDeviceIds: number[];
      routineIds: number[];
      routinesToEnableIds: number[];
      routinesToDisableIds: number[];
      goalIds: number[];
      internalRoutines: OperationModeRoutine[];
      allDay: boolean;
      startsAt: string;
      endsAt: string;
      ruleProfileId: number | null;
      preferenceId: number | null;
      applyRuleProfile: boolean;
      applyNotificationPreference: boolean;
      applyRoutines: boolean;
      preserveCriticalSound: boolean;
      lastActivatedAt: string | null;
    }
  ) {
    super(props.id);
  }

  get userId(): number { return this.props.userId; }
  get locationId(): number { return this.props.locationId; }
  get name(): string { return this.props.name; }
  get description(): string { return this.props.description; }
  get status(): OperationModeStatus { return this.props.status; }
  get roomIds(): number[] { return this.props.roomIds; }
  get groupIds(): number[] { return this.props.groupIds; }
  get deviceIds(): number[] { return this.props.deviceIds; }
  get turnOnDeviceIds(): number[] { return this.props.turnOnDeviceIds; }
  get turnOffDeviceIds(): number[] { return this.props.turnOffDeviceIds; }
  get keepOnDeviceIds(): number[] { return this.props.keepOnDeviceIds; }
  get routineIds(): number[] { return this.props.routineIds; }
  get routinesToEnableIds(): number[] { return this.props.routinesToEnableIds; }
  get routinesToDisableIds(): number[] { return this.props.routinesToDisableIds; }
  get goalIds(): number[] { return this.props.goalIds; }
  get internalRoutines(): OperationModeRoutine[] { return this.props.internalRoutines; }
  get allDay(): boolean { return this.props.allDay; }
  get startsAt(): string { return this.props.startsAt; }
  get endsAt(): string { return this.props.endsAt; }
  get ruleProfileId(): number | null { return this.props.ruleProfileId; }
  get preferenceId(): number | null { return this.props.preferenceId; }
  get applyRuleProfile(): boolean { return this.props.applyRuleProfile; }
  get applyNotificationPreference(): boolean { return this.props.applyNotificationPreference; }
  get applyRoutines(): boolean { return this.props.applyRoutines; }
  get preserveCriticalSound(): boolean { return this.props.preserveCriticalSound; }
  get lastActivatedAt(): string | null { return this.props.lastActivatedAt; }
}

export interface OperationModePreview {
  modeId: number;
  locationId: number;
  locationName: string;
  affectedDeviceIds: number[];
  ignoredRemovedDeviceIds: number[];
  ignoredMaintenanceDeviceIds: number[];
  roomIds: number[];
  groupIds: number[];
  routineIds: number[];
  internalRoutineCount?: number;
  goalIds: number[];
  ruleProfileId: number | null;
  preferenceId: number | null;
  evidence: string;
  explanation: string;
  recommendedAction: string;
}

export interface OperationModeActivation {
  mode: OperationMode;
  turnedOnDeviceIds: number[];
  turnedOffDeviceIds: number[];
  ignoredRemovedDeviceIds: number[];
  ignoredMaintenanceDeviceIds: number[];
  enabledRoutineIds: number[];
  disabledRoutineIds: number[];
  evidence: string;
  explanation: string;
  recommendedAction: string;
}
