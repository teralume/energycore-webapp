import { Injectable } from '@angular/core';

import { Routine } from '../model/routine.entity';
import { RoutineConflictCandidate } from '../model/routine-conflict-candidate.model';

@Injectable({
  providedIn: 'root',
})
export class RoutineConflictCheckerService {
  hasConflict(routines: Routine[], candidate: RoutineConflictCandidate): boolean {
    return routines.some(
      (routine) =>
        routine.enabled &&
        routine.targetType === candidate.targetType &&
        routine.targetId === candidate.targetId &&
        routine.time === candidate.time &&
        routine.action === candidate.action
    );
  }
}
