import { Injectable } from '@angular/core';

import { AlertLevel } from '../model/alert.entity';
import { NotificationPreference } from '../model/notification-preference.entity';

@Injectable({
  providedIn: 'root',
})
export class NotificationChannelPolicyService {
  canNotify(preference: NotificationPreference | null, level: AlertLevel): boolean {
    if (!preference) return true;

    if (!preference.hasAnyChannelEnabled) return false;

    if (preference.criticalOnly) {
      return level === 'CRITICAL';
    }

    return preference.allowsLevel(level) && this.isLevelAllowed(level, preference.minimumLevel);
  }

  private isLevelAllowed(level: AlertLevel, minimumLevel: AlertLevel): boolean {
    const priority: Record<AlertLevel, number> = {
      STABLE: 1,
      SUCCESS: 2,
      INFO: 3,
      WARNING: 4,
      CRITICAL: 5,
    };

    return priority[level] >= priority[minimumLevel];
  }
}
