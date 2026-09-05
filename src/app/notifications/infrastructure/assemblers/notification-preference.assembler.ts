import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { NotificationPreference } from '../../domain/model/notification-preference.entity';
import { NotificationPreferenceResource } from '../resources/notification-preference.resource';
import { NotificationPreferenceResponse } from '../responses/notification-preference.response';

export class NotificationPreferenceAssembler extends BaseAssembler<
  NotificationPreference,
  NotificationPreferenceResource,
  NotificationPreferenceResponse
> {
  override toEntity(
    response: NotificationPreferenceResponse
  ): NotificationPreference {
    return new NotificationPreference({
      id: response.id,
      userId: response.userId,
      emailEnabled: response.emailEnabled,
      pushEnabled: response.pushEnabled,
      inAppEnabled: response.inAppEnabled,
      toastEnabled: response.toastEnabled,
      dashboardEnabled: response.dashboardEnabled,
      criticalOnly: response.criticalOnly,
      minimumLevel: response.minimumLevel,
      scopeType: response.scopeType,
      scopeId: response.scopeId,
      allowedLevels: response.allowedLevels,
      allowedSourceTypes: response.allowedSourceTypes,
      quietHoursEnabled: response.quietHoursEnabled,
      quietHoursStart: response.quietHoursStart,
      quietHoursEnd: response.quietHoursEnd,
      criticalBreaksQuietHours: response.criticalBreaksQuietHours,
      groupSimilarAlerts: response.groupSimilarAlerts,
      remindersEnabled: response.remindersEnabled,
      cooldownMinutes: response.cooldownMinutes,
      maxAlertsPerHour: response.maxAlertsPerHour,
      routineNightSilence: response.routineNightSilence,
      goalDeadlineAlerts: response.goalDeadlineAlerts,
      maintenanceDeviceAlerts: response.maintenanceDeviceAlerts,
      systemRecommendations: response.systemRecommendations,
      dailySummaryEnabled: response.dailySummaryEnabled,
      weeklySummaryEnabled: response.weeklySummaryEnabled,
      monthlyReportEnabled: response.monthlyReportEnabled,
      defaultDeliveryMode: response.defaultDeliveryMode,
    });
  }

  override toResource(
    entity: NotificationPreference
  ): NotificationPreferenceResource {
    return {
      userId: entity.userId,
      emailEnabled: entity.emailEnabled,
      pushEnabled: entity.pushEnabled,
      inAppEnabled: entity.inAppEnabled,
      toastEnabled: entity.toastEnabled,
      dashboardEnabled: entity.dashboardEnabled,
      criticalOnly: entity.criticalOnly,
      minimumLevel: entity.minimumLevel,
      scopeType: entity.scopeType,
      scopeId: entity.scopeId,
      allowedLevels: entity.allowedLevels.join(','),
      allowedSourceTypes: entity.allowedSourceTypes.join(','),
      quietHoursEnabled: entity.quietHoursEnabled,
      quietHoursStart: entity.quietHoursStart,
      quietHoursEnd: entity.quietHoursEnd,
      criticalBreaksQuietHours: entity.criticalBreaksQuietHours,
      groupSimilarAlerts: entity.groupSimilarAlerts,
      remindersEnabled: entity.remindersEnabled,
      cooldownMinutes: entity.cooldownMinutes,
      maxAlertsPerHour: entity.maxAlertsPerHour,
      routineNightSilence: entity.routineNightSilence,
      goalDeadlineAlerts: entity.goalDeadlineAlerts,
      maintenanceDeviceAlerts: entity.maintenanceDeviceAlerts,
      systemRecommendations: entity.systemRecommendations,
      dailySummaryEnabled: entity.dailySummaryEnabled,
      weeklySummaryEnabled: entity.weeklySummaryEnabled,
      monthlyReportEnabled: entity.monthlyReportEnabled,
      defaultDeliveryMode: entity.defaultDeliveryMode,
    };
  }
}
