import { Injectable } from '@angular/core';

import { EnergyGoal } from '../model/energy-goal.entity';

type EnergyGoalProgress = Pick<
  EnergyGoal,
  'currentKilowattHours' | 'targetKilowattHours' | 'deadline'
>;

@Injectable({
  providedIn: 'root',
})
export class EnergyGoalPolicyService {
  canCreateGoal(title: string, targetKilowattHours: number, deadline: string): boolean {
    return title.trim().length >= 3 && targetKilowattHours > 0 && deadline.trim().length > 0;
  }

  resolveStatus(goal: EnergyGoalProgress): 'ACTIVE' | 'COMPLETED' | 'FAILED' {
    if (goal.currentKilowattHours > goal.targetKilowattHours) {
      return 'FAILED';
    }

    const today = new Date().toISOString().slice(0, 10);

    if (goal.deadline < today) {
      return goal.currentKilowattHours > goal.targetKilowattHours ? 'FAILED' : 'ACTIVE';
    }

    return 'ACTIVE';
  }
}
