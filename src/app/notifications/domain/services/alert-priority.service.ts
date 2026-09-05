import { Injectable } from '@angular/core';

import { Alert, AlertLevel } from '../model/alert.entity';

@Injectable({
  providedIn: 'root',
})
export class AlertPriorityService {
  private readonly priority: Record<AlertLevel, number> = {
    CRITICAL: 5,
    WARNING: 4,
    INFO: 3,
    SUCCESS: 2,
    STABLE: 1,
  };

  sortByPriority(alerts: Alert[]): Alert[] {
    return [...alerts].sort((first, second) => {
      const priorityDifference =
        this.priority[second.level] - this.priority[first.level];

      if (priorityDifference !== 0) return priorityDifference;

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });
  }

  getPriorityValue(level: AlertLevel): number {
    return this.priority[level];
  }
}
