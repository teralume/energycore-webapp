import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AlertLevel } from '../../domain/model/alert.entity';
import { AlertRuleProfile } from '../../domain/model/alert-rule-profile.entity';
import { RuleEvaluationResult } from '../../domain/model/rule-evaluation-result.entity';

import { CreateAlertCommand } from '../commands/create-alert.command';
import { CreateAlertRuleCommand } from '../commands/create-alert-rule.command';
import { MarkAlertAsReadCommand } from '../commands/mark-alert-as-read.command';
import { UpdateAlertRuleStatusCommand } from '../commands/update-alert-rule-status.command';
import { UpdateNotificationPreferenceCommand } from '../commands/update-notification-preference.command';

import { AlertRulesApiService } from '../../infrastructure/api/alert-rules-api.service';
import { AlertRuleProfilesApiService } from '../../infrastructure/api/alert-rule-profiles-api.service';
import { AlertsApiService } from '../../infrastructure/api/alerts-api.service';
import { NotificationPreferencesApiService } from '../../infrastructure/api/notification-preferences-api.service';

import { AlertRuleAssembler } from '../../infrastructure/assemblers/alert-rule.assembler';
import { AlertAssembler } from '../../infrastructure/assemblers/alert.assembler';
import { NotificationPreferenceAssembler } from '../../infrastructure/assemblers/notification-preference.assembler';

import { NotificationChannelPolicyService } from '../../domain/services/notification-channel-policy.service';
import { NotificationClassificationPolicy } from '../../domain/model/notification-classification-policy.model';

import { NotificationsStore } from '../stores/notifications.store';

@Injectable({
  providedIn: 'root',
})
export class NotificationsFacade {
  private readonly alertAssembler = new AlertAssembler();
  private readonly alertRuleAssembler = new AlertRuleAssembler();
  private readonly notificationPreferenceAssembler =
    new NotificationPreferenceAssembler();

  get alerts() {
    return this.store.alerts;
  }

  get alertRules() {
    return this.store.alertRules;
  }

  get alertRuleProfiles() {
    return this.store.alertRuleProfiles;
  }

  get ruleEvaluationResult() {
    return this.store.ruleEvaluationResult;
  }

  get notificationPreference() {
    return this.store.notificationPreference;
  }

  get notificationClassificationPolicy() {
    return this.store.notificationClassificationPolicy;
  }

  get loading() {
    return this.store.loading;
  }

  get error() {
    return this.store.error;
  }

  get unreadAlerts() {
    return this.store.unreadAlerts;
  }

  get criticalAlerts() {
    return this.store.criticalAlerts;
  }

  get enabledAlertRules() {
    return this.store.enabledAlertRules;
  }

  get sortedAlerts() {
    return this.store.sortedAlerts;
  }

  constructor(
    private readonly alertsApi: AlertsApiService,
    private readonly alertRulesApi: AlertRulesApiService,
    private readonly alertRuleProfilesApi: AlertRuleProfilesApiService,
    private readonly notificationPreferencesApi: NotificationPreferencesApiService,
    private readonly notificationChannelPolicy: NotificationChannelPolicyService,
    private readonly store: NotificationsStore
  ) {}

  async loadNotifications(): Promise<void> {
    this.startRequest();

    try {
      await Promise.all([
        this.loadAlerts(),
        this.loadAlertRules(),
        this.loadAlertRuleProfiles(),
        this.loadNotificationPreference(),
      ]);
    } catch (error) {
      console.error(error);
      this.store.setError('alerts.loadError');
    } finally {
      this.finishRequest();
    }
  }

  async loadAlerts(): Promise<void> {
    const responses = await firstValueFrom(this.alertsApi.findAllForCurrentUser());

    const alerts = responses
      .map((response) => this.alertAssembler.toEntity(response))
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      );

    this.store.setAlerts(alerts);
  }

  async createAlert(command: CreateAlertCommand): Promise<boolean> {
    this.store.clearMessages();

    try {
      if (!command.title.trim() || !command.message.trim()) {
        this.store.setError('alerts.createError');
        return false;
      }

      const preference = this.store.notificationPreference();

      const canNotify = this.notificationChannelPolicy.canNotify(
        preference,
        command.level
      );

      void canNotify;

      const response = await firstValueFrom(
        this.alertsApi.createAlert({
          title: command.title.trim(),
          message: command.message.trim(),
          level: command.level,
          sourceType: command.sourceType ?? 'SYSTEM',
          sourceId: command.sourceId ?? null,
          sourceLabel: command.sourceLabel ?? null,
          eventType: command.eventType ?? 'MANUAL',
          threadKey: command.threadKey,
          evidence: command.evidence ?? null,
          explanation: command.explanation ?? null,
          recommendedAction: command.recommendedAction ?? null,
          severityScore: command.severityScore,
          expiresAt: command.expiresAt ?? null,
        })
      );

      const alert = this.alertAssembler.toEntity(response);
      this.store.prependAlert(alert);

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('alerts.createError');
      return false;
    }
  }

  async markAsRead(command: MarkAlertAsReadCommand): Promise<boolean> {
    this.store.clearMessages();

    try {
      const response = await firstValueFrom(
        this.alertsApi.markAsRead(command.alertId)
      );

      const updatedAlert = this.alertAssembler.toEntity(response);

      this.store.updateAlert(updatedAlert);

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('alerts.markAsReadError');
      return false;
    }
  }

  async dismissAlert(alertId: number, minutes = 10): Promise<boolean> {
    this.store.clearMessages();

    try {
      const response = await firstValueFrom(
        this.alertsApi.dismiss(alertId, minutes)
      );

      const updatedAlert = this.alertAssembler.toEntity(response);
      this.store.updateAlert(updatedAlert);

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('alerts.dismissError');
      return false;
    }
  }

  async resolveAlert(alertId: number): Promise<boolean> {
    this.store.clearMessages();

    try {
      const response = await firstValueFrom(
        this.alertsApi.resolve(alertId)
      );

      const updatedAlert = this.alertAssembler.toEntity(response);
      this.store.updateAlert(updatedAlert);

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('alerts.resolveError');
      return false;
    }
  }

  async deleteAlert(alertId: number): Promise<boolean> {
    this.store.clearMessages();

    try {
      await firstValueFrom(this.alertsApi.delete(alertId));
      this.store.removeAlert(alertId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('alerts.deleteError');
      return false;
    }
  }

  async loadAlertRules(): Promise<void> {
    const responses = await firstValueFrom(
      this.alertRulesApi.findAllForCurrentUser()
    );

    const alertRules = responses.map((response) =>
      this.alertRuleAssembler.toEntity(response)
    );

    this.store.setAlertRules(alertRules);
  }

  async createAlertRule(command: CreateAlertRuleCommand): Promise<boolean> {
    this.startRequest();

    try {
      if (!command.name.trim() || command.threshold <= 0) {
        this.store.setError('alertRules.createError');
        return false;
      }

      const response = await firstValueFrom(
        this.alertRulesApi.create({
          name: command.name.trim(),
          metric: command.metric,
          conditionType: command.condition,
          threshold: Number(command.threshold),
          level: command.level,
          scopeType: command.scopeType ?? 'GENERAL',
          scopeId: command.scopeId ?? null,
          evaluatorType: command.evaluatorType ?? 'ACTIVE_POWER',
          weight: command.weight ?? 10,
          profileName: command.profileName ?? 'General',
        })
      );

      const rule = this.alertRuleAssembler.toEntity(response);
      this.store.prependAlertRule(rule);

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('alertRules.createError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async updateAlertRuleStatus(
    command: UpdateAlertRuleStatusCommand
  ): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.alertRulesApi.toggle(command.alertRuleId)
      );

      const updatedRule = this.alertRuleAssembler.toEntity(response);

      this.store.updateAlertRule(updatedRule);

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('alertRules.updateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async deleteAlertRule(alertRuleId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.alertRulesApi.delete(alertRuleId));
      this.store.removeAlertRule(alertRuleId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('alertRules.deleteError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async loadAlertRuleProfiles(): Promise<void> {
    const responses = await firstValueFrom(
      this.alertRuleProfilesApi.findAllForCurrentUser()
    );

    const profiles = responses.map((response) => new AlertRuleProfile({
      id: response.id,
      userId: response.userId,
      name: response.name,
      description: response.description,
      scopeType: response.scopeType,
      scopeId: response.scopeId ?? null,
      mode: response.mode,
      sensitivity: response.sensitivity,
      active: response.active,
    }));

    this.store.setAlertRuleProfiles(profiles);
  }

  async createAlertRuleProfile(ruleProfile: {
    name: string;
    description?: string;
    scopeType?: 'GENERAL' | 'WORKPLACE' | 'ROOM' | 'DEVICE' | 'GROUP' | 'ROUTINE' | 'GOAL';
    scopeId?: string | null;
    mode?: 'BALANCED' | 'SAVINGS' | 'PROTECTION';
    sensitivity?: 'LOW' | 'NORMAL' | 'HIGH' | 'STRICT';
  }): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.alertRuleProfilesApi.create({
          name: ruleProfile.name.trim(),
          description: ruleProfile.description ?? '',
          scopeType: ruleProfile.scopeType ?? 'GENERAL',
          scopeId: ruleProfile.scopeId ?? null,
          mode: ruleProfile.mode ?? 'BALANCED',
          sensitivity: ruleProfile.sensitivity ?? 'NORMAL',
        })
      );

      const profile = new AlertRuleProfile({
        id: response.id,
        userId: response.userId,
        name: response.name,
        description: response.description,
        scopeType: response.scopeType,
        scopeId: response.scopeId ?? null,
        mode: response.mode,
        sensitivity: response.sensitivity,
        active: response.active,
      });

      this.store.setAlertRuleProfiles([profile, ...this.store.alertRuleProfiles()]);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('alertRules.profileCreateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async evaluateRules(evaluationRequest: {
    scopeType?: 'GENERAL' | 'WORKPLACE' | 'ROOM' | 'DEVICE' | 'GROUP' | 'ROUTINE' | 'GOAL';
    scopeId?: string | null;
    observedValue?: number;
  } = {}): Promise<RuleEvaluationResult | null> {
    try {
      const response = await firstValueFrom(
        this.alertRulesApi.evaluate({
          scopeType: evaluationRequest.scopeType ?? 'GENERAL',
          scopeId: evaluationRequest.scopeId ?? null,
          observedValue: evaluationRequest.observedValue ?? 0,
        })
      );

      const result: RuleEvaluationResult = {
        userId: response.userId,
        scopeType: response.scopeType,
        scopeId: response.scopeId ?? null,
        level: response.level,
        severityScore: response.severityScore,
        evidence: response.evidence,
        explanation: response.explanation,
        recommendedAction: response.recommendedAction,
        sourceType: response.sourceType,
        sourceId: response.sourceId ?? null,
        eventType: response.eventType,
        threadKey: response.threadKey,
        activeEvaluatorCount: response.activeEvaluatorCount,
        totalWeight: response.totalWeight,
      };

      this.store.setRuleEvaluationResult(result);
      return result;
    } catch (error) {
      console.error(error);
      this.store.setError('alertRules.evaluateError');
      return null;
    }
  }

  clearRuleEvaluationResult(): void {
    this.store.setRuleEvaluationResult(null);
  }

  async loadNotificationPreference(): Promise<void> {
    const response = await firstValueFrom(
      this.notificationPreferencesApi.findCurrent()
    );

    this.store.setNotificationPreference(
      this.notificationPreferenceAssembler.toEntity(response)
    );
  }

  async updateNotificationPreference(
    command: UpdateNotificationPreferenceCommand
  ): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.notificationPreferencesApi.save({
          emailEnabled: command.emailEnabled,
          pushEnabled: command.pushEnabled,
          inAppEnabled: command.inAppEnabled,
          toastEnabled: command.toastEnabled,
          dashboardEnabled: command.dashboardEnabled,
          criticalOnly: command.criticalOnly,
          minimumLevel: command.minimumLevel,
          scopeType: command.scopeType,
          scopeId: command.scopeId,
          allowedLevels: command.allowedLevels,
          allowedSourceTypes: command.allowedSourceTypes,
          quietHoursEnabled: command.quietHoursEnabled,
          quietHoursStart: command.quietHoursStart,
          quietHoursEnd: command.quietHoursEnd,
          criticalBreaksQuietHours: command.criticalBreaksQuietHours,
          groupSimilarAlerts: command.groupSimilarAlerts,
          remindersEnabled: command.remindersEnabled,
          cooldownMinutes: command.cooldownMinutes,
          maxAlertsPerHour: command.maxAlertsPerHour,
          routineNightSilence: command.routineNightSilence,
          goalDeadlineAlerts: command.goalDeadlineAlerts,
          maintenanceDeviceAlerts: command.maintenanceDeviceAlerts,
          systemRecommendations: command.systemRecommendations,
          dailySummaryEnabled: command.dailySummaryEnabled,
          weeklySummaryEnabled: command.weeklySummaryEnabled,
          defaultDeliveryMode: command.defaultDeliveryMode,
        })
      );

      this.store.setNotificationPreference(
        this.notificationPreferenceAssembler.toEntity(response)
      );

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('notificationPreferences.updateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  clearMessages(): void {
    this.store.clearMessages();
  }

  updateNotificationClassificationPolicy(
    policy: NotificationClassificationPolicy
  ): void {
    this.store.setNotificationClassificationPolicy(policy);
  }

  getPriorityValue(level: AlertLevel): number {
    return this.store.getPriorityValue(level);
  }

  private startRequest(): void {
    this.store.setLoading(true);
    this.store.clearMessages();
  }

  private finishRequest(): void {
    this.store.setLoading(false);
  }
}
