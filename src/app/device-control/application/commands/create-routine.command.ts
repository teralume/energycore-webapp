import {
  RoutineAction,
  RoutineRepeatType,
  RoutineTargetType,
} from '../../domain/model/routine.entity';

export interface CreateRoutineCommand {
  name: string;
  action: RoutineAction;
  time: string;
  targetType: RoutineTargetType;
  targetId: number;
  deviceId?: number | null;
  groupId?: number | null;
  repeatType?: RoutineRepeatType;
  daysOfWeek?: string | null;
  intervalDays?: number | null;
  startsOn?: string | null;
}
