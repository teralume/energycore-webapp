import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NotificationsFacade } from '../../../application/services/notifications.facade';
import { AlertLevel } from '../../../domain/model/alert.entity';
import {
  AlertRule,
  AlertRuleCondition,
  AlertRuleMetric,
  RuleEvaluatorType,
  RuleScopeType,
} from '../../../domain/model/alert-rule.entity';
import { RuleEvaluationResult } from '../../../domain/model/rule-evaluation-result.entity';

import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { AppNumberStepperComponent } from '../../../../shared/presentation/components/app-number-stepper/app-number-stepper.component';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { SettingsSectionComponent } from '../../../../shared/presentation/components/settings-section/settings-section.component';
import { AlertRuleCardComponent } from '../../components/alert-rule-card/alert-rule-card.component';
import {
  buildNotificationSeverityBands,
  NotificationSeverityBand,
} from '../../../domain/model/notification-classification-policy.model';

@Component({
  selector: 'app-alert-rules-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    AppButtonComponent,
    AppDropdownComponent,
    AppNumberStepperComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    SettingsSectionComponent,
    AlertRuleCardComponent,
  ],
  templateUrl: './alert-rules-page.component.html',
  styleUrls: ['./alert-rules-page.component.scss'],
})
export class AlertRulesPageComponent implements OnInit, OnDestroy {
  newRuleName = '';
  newRuleMetric: AlertRuleMetric = 'WATTS';
  newRuleCondition: AlertRuleCondition = 'GREATER_OR_EQUAL_THAN';
  newRuleLevel: AlertLevel = 'WARNING';
  newRuleScope: RuleScopeType = 'GENERAL';
  newRuleEvaluator: RuleEvaluatorType = 'ACTIVE_POWER';
  newRuleThreshold = 750;
  newRuleWeight = 10;
  observedValue = 0;
  isEvaluationResultDismissing = false;
  private evaluationResultDismissTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly evaluationResultDismissMs = 520;

  readonly metricOptions: DropdownOption[] = [
    { label: '', labelKey: 'alertRules.metrics.watts', value: 'WATTS', descriptionKey: 'alertRules.metricDescriptions.watts' },
    { label: '', labelKey: 'alertRules.metrics.highReadingCount', value: 'HIGH_READING_COUNT', descriptionKey: 'alertRules.metricDescriptions.highReadingCount' },
    { label: '', labelKey: 'alertRules.metrics.averageWatts', value: 'AVERAGE_WATTS', descriptionKey: 'alertRules.metricDescriptions.averageWatts' },
  ];

  readonly conditionOptions: DropdownOption[] = [
    { label: '', labelKey: 'alertRules.conditions.greaterOrEqual', value: 'GREATER_OR_EQUAL_THAN' },
    { label: '', labelKey: 'alertRules.conditions.greaterThan', value: 'GREATER_THAN' },
  ];

  readonly levelOptions: DropdownOption[] = [
    { label: '', labelKey: 'alerts.levels.info', value: 'INFO' },
    { label: '', labelKey: 'alerts.levels.warning', value: 'WARNING' },
    { label: '', labelKey: 'alerts.levels.critical', value: 'CRITICAL' },
  ];

  readonly scopeOptions: DropdownOption[] = [
    { label: '', labelKey: 'alertRules.scopes.general', value: 'GENERAL' },
    { label: '', labelKey: 'operationModes.site', value: 'WORKPLACE' },
    { label: '', labelKey: 'devices.room', value: 'ROOM' },
    { label: '', labelKey: 'operationModes.routineTargetTypes.group', value: 'GROUP' },
    { label: '', labelKey: 'operationModes.routineTargetTypes.device', value: 'DEVICE' },
    { label: '', labelKey: 'nav.routines', value: 'ROUTINE' },
    { label: '', labelKey: 'reporting.goals', value: 'GOAL' },
  ];

  readonly evaluatorOptions: DropdownOption[] = [
    { label: '', labelKey: 'alertRules.evaluators.activePower', value: 'ACTIVE_POWER' },
    { label: '', labelKey: 'alertRules.evaluators.dailyKwh', value: 'DAILY_KWH' },
    { label: '', labelKey: 'alertRules.evaluators.averageWatts', value: 'AVERAGE_WATTS' },
    { label: '', labelKey: 'alertRules.evaluators.highReadingCount', value: 'HIGH_READING_COUNT' },
    { label: '', labelKey: 'alertRules.evaluators.sustainedConsumption', value: 'SUSTAINED_CONSUMPTION' },
    { label: '', labelKey: 'alertRules.evaluators.deviceCount', value: 'DEVICE_COUNT' },
    { label: '', labelKey: 'alertRules.evaluators.goalUsage', value: 'GOAL_USAGE' },
    { label: '', labelKey: 'alertRules.evaluators.goalDeadline', value: 'GOAL_DEADLINE' },
    { label: '', labelKey: 'alertRules.evaluators.routineContext', value: 'ROUTINE_CONTEXT' },
    { label: '', labelKey: 'alertRules.evaluators.costEstimate', value: 'COST_ESTIMATE' },
    { label: '', labelKey: 'alertRules.evaluators.configurationCoverage', value: 'CONFIGURATION_COVERAGE' },
  ];

  constructor(
    readonly notificationsFacade: NotificationsFacade,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.notificationsFacade.loadNotifications();
  }

  ngOnDestroy(): void {
    this.clearEvaluationResultDismissTimeout();
  }

  updateMetric(value: string): void {
    this.newRuleMetric = value as AlertRuleMetric;
  }

  updateCondition(value: string): void {
    this.newRuleCondition = value as AlertRuleCondition;
  }

  updateLevel(value: string): void {
    this.newRuleLevel = value as AlertLevel;
  }

  updateScope(value: string): void {
    this.newRuleScope = value as RuleScopeType;
  }

  updateEvaluator(value: string): void {
    this.newRuleEvaluator = value as RuleEvaluatorType;
  }

  async createRule(): Promise<void> {
    const name = this.newRuleName.trim();

    if (!name) {
      this.toastService.warning(this.t('alertRules.validation.nameRequired'));
      return;
    }

    const created = await this.notificationsFacade.createAlertRule({
      name,
      metric: this.newRuleMetric,
      condition: this.newRuleCondition,
      threshold: this.newRuleThreshold,
      level: this.newRuleLevel,
      scopeType: this.newRuleScope,
      scopeId: null,
      evaluatorType: this.newRuleEvaluator,
      weight: this.newRuleWeight,
    });

    if (created) {
      this.newRuleName = '';
      this.toastService.success(this.t('alertRules.createSuccess'));
      return;
    }

    this.toastService.error(this.t('alertRules.createError'));
  }

  async toggleRule(rule: AlertRule): Promise<void> {
    const updated = await this.notificationsFacade.updateAlertRuleStatus({
      alertRuleId: rule.id,
      enabled: !rule.enabled,
    });

    if (updated) {
      this.toastService.info(
        rule.enabled
          ? this.t('alertRules.toasts.paused')
          : this.t('alertRules.toasts.activated')
      );
      return;
    }

    this.toastService.error(this.t('alertRules.updateError'));
  }

  async deleteRule(ruleId: number): Promise<void> {
    const deleted = await this.notificationsFacade.deleteAlertRule(ruleId);

    if (deleted) {
      this.toastService.info(this.t('alertRules.toasts.deleted'));
      return;
    }

    this.toastService.error(this.t('alertRules.deleteError'));
  }

  async evaluateRules(): Promise<void> {
    this.clearEvaluationResultDismissTimeout();
    this.isEvaluationResultDismissing = false;

    const result = await this.notificationsFacade.evaluateRules({
      scopeType: this.newRuleScope,
      scopeId: null,
      observedValue: this.observedValue,
    });

    if (!result) {
      this.toastService.error(this.t('alertRules.toasts.evaluateError'));
      return;
    }

    this.toastService.success(this.t('alertRules.toasts.evaluated'));
  }

  dismissEvaluationResult(): void {
    if (!this.evaluationResult || this.isEvaluationResultDismissing) {
      return;
    }

    this.isEvaluationResultDismissing = true;
    this.clearEvaluationResultDismissTimeout();
    this.evaluationResultDismissTimeout = setTimeout(() => {
      this.notificationsFacade.clearRuleEvaluationResult();
      this.isEvaluationResultDismissing = false;
      this.evaluationResultDismissTimeout = null;
    }, this.evaluationResultDismissMs);
  }

  get rules(): AlertRule[] {
    return this.notificationsFacade.alertRules();
  }

  get activeRules(): AlertRule[] {
    return this.rules.filter((rule) => rule.enabled);
  }

  get inactiveRules(): AlertRule[] {
    return this.rules.filter((rule) => !rule.enabled);
  }

  get totalWeight(): number {
    return this.activeRules.reduce((total, rule) => total + rule.weight, 0);
  }

  get severityRanges(): NotificationSeverityBand[] {
    return buildNotificationSeverityBands(
      this.notificationsFacade.notificationClassificationPolicy()
    );
  }

  get evaluationResult(): RuleEvaluationResult | null {
    return this.notificationsFacade.ruleEvaluationResult();
  }

  private clearEvaluationResultDismissTimeout(): void {
    if (this.evaluationResultDismissTimeout === null) {
      return;
    }

    clearTimeout(this.evaluationResultDismissTimeout);
    this.evaluationResultDismissTimeout = null;
  }

  levelLabel(level: AlertLevel): string {
    const labels: Record<AlertLevel, string> = {
      STABLE: 'alerts.levels.stable',
      SUCCESS: 'alerts.levels.success',
      INFO: 'alerts.levels.info',
      WARNING: 'alerts.levels.warning',
      CRITICAL: 'alerts.levels.critical',
    };

    return this.t(labels[level] ?? level);
  }

  severityRangeLabel(range: NotificationSeverityBand): string {
    return this.levelLabel(range.level);
  }

  severityRangeDescription(range: NotificationSeverityBand): string {
    const descriptions: Record<AlertLevel, string> = {
      STABLE: 'alertRules.severityRanges.stableDescription',
      SUCCESS: 'alerts.severityDescriptions.success',
      INFO: 'alertRules.severityRanges.infoDescription',
      WARNING: 'alertRules.severityRanges.warningDescription',
      CRITICAL: 'alertRules.severityRanges.criticalDescription',
    };

    return this.t(descriptions[range.level] ?? 'alerts.severityDescriptions.default');
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
