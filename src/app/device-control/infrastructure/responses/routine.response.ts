import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import {
  RoutineAction,
  RoutineRepeatType,
  RoutineTargetType,
} from '../../domain/model/routine.entity';

export interface RoutineResponse extends BaseResponse<number> {
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
}
