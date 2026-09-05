import { OperationModeRoutine, OperationModeStatus } from '../../domain/model/operation-mode.entity';

export interface OperationModeResponse {
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

export interface OperationModePreviewResponse {
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

export interface OperationModeActivationResponse {
  mode: OperationModeResponse;
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
