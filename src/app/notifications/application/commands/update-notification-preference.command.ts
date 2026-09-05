import { AlertLevel } from '../../domain/model/alert.entity';
import {
  NotificationDeliveryMode,
  NotificationPreferenceScope,
} from '../../domain/model/notification-preference.entity';

export interface UpdateNotificationPreferenceCommand {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled?: boolean;
  toastEnabled?: boolean;
  dashboardEnabled?: boolean;
  criticalOnly: boolean;
  minimumLevel: AlertLevel;
  scopeType?: NotificationPreferenceScope;
  scopeId?: string | null;
  allowedLevels?: string;
  allowedSourceTypes?: string;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  criticalBreaksQuietHours?: boolean;
  groupSimilarAlerts?: boolean;
  remindersEnabled?: boolean;
  cooldownMinutes?: number;
  maxAlertsPerHour?: number;
  routineNightSilence?: boolean;
  goalDeadlineAlerts?: boolean;
  maintenanceDeviceAlerts?: boolean;
  systemRecommendations?: boolean;
  dailySummaryEnabled?: boolean;
  weeklySummaryEnabled?: boolean;
  monthlyReportEnabled?: boolean;
  defaultDeliveryMode?: NotificationDeliveryMode;
}
