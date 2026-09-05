import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import {
  RoutineAction,
  RoutineRepeatType,
  RoutineTargetType,
} from '../../domain/model/routine.entity';

export interface RoutineResource extends BaseResource {
  userId?: number;
  deviceId?: number | null;
  groupId?: number | null;
  targetType: RoutineTargetType;
  targetId: number;
  name: string;
  action: RoutineAction;
  time: string;
  repeatType?: RoutineRepeatType;
  daysOfWeek?: string | null;
  intervalDays?: number | null;
  startsOn?: string | null;
  enabled?: boolean;
}
