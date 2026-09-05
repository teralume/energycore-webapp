import { Injectable, computed, signal } from '@angular/core';

import { Alert, AlertLevel } from '../../domain/model/alert.entity';
import { AlertRule } from '../../domain/model/alert-rule.entity';
import { AlertRuleProfile } from '../../domain/model/alert-rule-profile.entity';
import { RuleEvaluationResult } from '../../domain/model/rule-evaluation-result.entity';
import { NotificationPreference } from '../../domain/model/notification-preference.entity';
import {
  DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY,
  NotificationClassificationPolicy,
  normalizeNotificationClassificationPolicy,
} from '../../domain/model/notification-classification-policy.model';
import { AlertPriorityService } from '../../domain/services/alert-priority.service';
import { STORAGE_KEYS } from '../../../shared/infrastructure/constants/storage-keys';

@Injectable({
  providedIn: 'root',
})
export class NotificationsStore {
  private readonly alertsSignal = signal<Alert[]>([]);
  private readonly alertRulesSignal = signal<AlertRule[]>([]);
  private readonly alertRuleProfilesSignal = signal<AlertRuleProfile[]>([]);
  private readonly ruleEvaluationResultSignal = signal<RuleEvaluationResult | null>(null);
  private readonly notificationPreferenceSignal =
    signal<NotificationPreference | null>(null);
  private readonly notificationClassificationPolicySignal =
    signal<NotificationClassificationPolicy>(
      this.restoreNotificationClassificationPolicy()
    );

  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly alerts = computed(() => this.alertsSignal());
  readonly alertRules = computed(() => this.alertRulesSignal());
  readonly alertRuleProfiles = computed(() => this.alertRuleProfilesSignal());
  readonly ruleEvaluationResult = computed(() => this.ruleEvaluationResultSignal());
  readonly notificationPreference = computed(() =>
    this.notificationPreferenceSignal()
  );
  readonly notificationClassificationPolicy = computed(() =>
    this.notificationClassificationPolicySignal()
  );

  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly unreadAlerts = computed(() =>
    this.alertsSignal().filter((alert) => alert.isUnread)
  );

  readonly criticalAlerts = computed(() =>
    this.alertsSignal().filter((alert) => alert.isCritical)
  );

  readonly enabledAlertRules = computed(() =>
    this.alertRulesSignal().filter((rule) => rule.isEnabled)
  );

  readonly sortedAlerts = computed(() =>
    this.alertPriorityService.sortByPriority(this.alertsSignal())
  );

  constructor(private readonly alertPriorityService: AlertPriorityService) {}

  setAlerts(value: Alert[]): void {
    this.alertsSignal.set(value);
  }

  prependAlert(value: Alert): void {
    this.alertsSignal.update((alerts) => [value, ...alerts]);
  }

  updateAlert(value: Alert): void {
    this.alertsSignal.update((alerts) =>
      alerts.map((alert) => (alert.id === value.id ? value : alert))
    );
  }

  removeAlert(alertId: number): void {
    this.alertsSignal.update((alerts) =>
      alerts.filter((alert) => alert.id !== alertId)
    );
  }

  setAlertRules(value: AlertRule[]): void {
    this.alertRulesSignal.set(value);
  }

  setAlertRuleProfiles(value: AlertRuleProfile[]): void {
    this.alertRuleProfilesSignal.set(value);
  }

  setRuleEvaluationResult(value: RuleEvaluationResult | null): void {
    this.ruleEvaluationResultSignal.set(value);
  }

  prependAlertRule(value: AlertRule): void {
    this.alertRulesSignal.update((rules) => [value, ...rules]);
  }

  updateAlertRule(value: AlertRule): void {
    this.alertRulesSignal.update((rules) =>
      rules.map((rule) => (rule.id === value.id ? value : rule))
    );
  }

  removeAlertRule(alertRuleId: number): void {
    this.alertRulesSignal.update((rules) =>
      rules.filter((rule) => rule.id !== alertRuleId)
    );
  }

  setNotificationPreference(value: NotificationPreference | null): void {
    this.notificationPreferenceSignal.set(value);
  }

  setNotificationClassificationPolicy(value: NotificationClassificationPolicy): void {
    const normalized = normalizeNotificationClassificationPolicy(value);

    this.notificationClassificationPolicySignal.set(normalized);
    this.persistNotificationClassificationPolicy(normalized);
  }

  setLoading(value: boolean): void {
    this.loadingSignal.set(value);
  }

  setError(value: string | null): void {
    this.errorSignal.set(value);
  }

  clearMessages(): void {
    this.errorSignal.set(null);
  }

  getPriorityValue(level: AlertLevel): number {
    return this.alertPriorityService.getPriorityValue(level);
  }

  reset(): void {
    this.alertsSignal.set([]);
    this.alertRulesSignal.set([]);
    this.alertRuleProfilesSignal.set([]);
    this.ruleEvaluationResultSignal.set(null);
    this.notificationPreferenceSignal.set(null);
    this.notificationClassificationPolicySignal.set(DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY);
    this.persistNotificationClassificationPolicy(DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }

  private restoreNotificationClassificationPolicy(): NotificationClassificationPolicy {
    if (!this.canUseLocalStorage()) {
      return DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY;
    }

    try {
      const rawValue = localStorage.getItem(STORAGE_KEYS.notificationClassificationPolicy);

      if (!rawValue) {
        return DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY;
      }

      return normalizeNotificationClassificationPolicy(JSON.parse(rawValue));
    } catch {
      return DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY;
    }
  }

  private persistNotificationClassificationPolicy(
    value: NotificationClassificationPolicy
  ): void {
    if (!this.canUseLocalStorage()) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEYS.notificationClassificationPolicy,
        JSON.stringify(value)
      );
    } catch {
      return;
    }
  }

  private canUseLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
