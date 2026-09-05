import { OperationModeRoutine } from '../../domain/model/operation-mode.entity';

export interface CreateOperationModeCommand {
  locationId: number;
  name: string;
  description: string;
  roomIds: number[];
  groupIds: number[];
  deviceIds: number[];
  turnOnDeviceIds: number[];
  turnOffDeviceIds: number[];
  keepOnDeviceIds: number[];
  routineIds?: number[];
  routinesToEnableIds?: number[];
  routinesToDisableIds?: number[];
  goalIds: number[];
  internalRoutines: OperationModeRoutine[];
  allDay: boolean;
  startsAt: string;
  endsAt: string;
  ruleProfileId: number | null;
  preferenceId: number | null;
  applyRuleProfile: boolean;
  applyNotificationPreference: boolean;
  applyRoutines?: boolean;
  preserveCriticalSound: boolean;
}
