import {
  RoutineAction,
  RoutineTargetType,
} from './routine.entity';

export interface RoutineConflictCandidate {
  action: RoutineAction;
  time: string;
  targetType: RoutineTargetType;
  targetId: number;
}
