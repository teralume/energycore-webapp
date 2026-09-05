import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AlertLevel, AlertSourceType } from '../../../domain/model/alert.entity';
import {
  NotificationDeliveryMode,
  NotificationPreference,
} from '../../../domain/model/notification-preference.entity';
import { UpdateNotificationPreferenceCommand } from '../../../application/commands/update-notification-preference.command';
import { SettingToggleComponent } from '../../../../shared/presentation/components/setting-toggle/setting-toggle.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import {
  AppButtonComponent,
  AppButtonVariant,
} from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppTimePickerComponent } from '../../../../shared/presentation/components/app-time-picker/app-time-picker.component';
import {
  buildNotificationSeverityBands,
  DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY,
  levelForNotificationScore,
  NotificationClassificationPolicy,
  NotificationSeverityBand,
} from '../../../domain/model/notification-classification-policy.model';

interface SignalWeight {
  source: AlertSourceType;
  label: string;
  labelKey: string;
  description: string;
  descriptionKey: string;
  weight: number;
}

@Component({
  selector: 'app-notification-preference-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    SettingToggleComponent,
    AppDropdownComponent,
    AppButtonComponent,
    AppTimePickerComponent,
  ],
  templateUrl: './notification-preference-form.component.html',
  styleUrls: ['./notification-preference-form.component.scss'],
})
export class NotificationPreferenceFormComponent implements OnChanges {
  @Input() preference: NotificationPreference | null = null;
  @Input() classificationPolicy: NotificationClassificationPolicy =
    DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY;

  @Output() saved = new EventEmitter<UpdateNotificationPreferenceCommand>();
  @Output() classificationPolicyChanged =
    new EventEmitter<NotificationClassificationPolicy>();

  stableMax = 25;
  neutralMax = 55;
  warningMax = 80;
  previewScore = 62;
  previewSource: AlertSourceType = 'GOAL';

  emailEnabled = true;
  pushEnabled = true;
  inAppEnabled = true;
  toastEnabled = true;
  dashboardEnabled = true;
  criticalOnly = false;
  minimumLevel: AlertLevel = 'INFO';
  allowedLevels = new Set<AlertLevel>(['STABLE', 'INFO', 'WARNING', 'CRITICAL', 'SUCCESS']);
  allowedSourceTypes = new Set<AlertSourceType>([
    'DEVICE',
    'GROUP',
    'ROOM',
    'WORKPLACE',
    'ROUTINE',
    'GOAL',
    'REPORT',
    'RULE',
    'MODE',
    'SYSTEM',
  ]);
  quietHoursEnabled = false;
  quietHoursStart = '22:00';
  quietHoursEnd = '07:00';
  criticalBreaksQuietHours = true;
  groupSimilarAlerts = true;
  remindersEnabled = true;
  cooldownMinutes = 10;
  maxAlertsPerHour = 12;
  routineNightSilence = true;
  goalDeadlineAlerts = true;
  maintenanceDeviceAlerts = false;
  systemRecommendations = true;
  dailySummaryEnabled = true;
  weeklySummaryEnabled = false;
  monthlyReportEnabled = true;
  defaultDeliveryMode: NotificationDeliveryMode = 'BANNER';

  readonly levels: AlertLevel[] = ['SUCCESS', 'STABLE', 'INFO', 'WARNING', 'CRITICAL'];
  readonly riskLevels: AlertLevel[] = ['STABLE', 'INFO', 'WARNING', 'CRITICAL'];
  readonly sources: AlertSourceType[] = [
    'DEVICE',
    'GROUP',
    'ROOM',
    'WORKPLACE',
    'ROUTINE',
    'GOAL',
    'REPORT',
    'RULE',
    'MODE',
    'SYSTEM',
  ];
  readonly levelOptions: DropdownOption[] = [
    { label: '', labelKey: 'alerts.levels.stable', value: 'STABLE', descriptionKey: 'notificationPreferences.levelDescriptions.stable' },
    { label: '', labelKey: 'alerts.levels.info', value: 'INFO', descriptionKey: 'notificationPreferences.levelDescriptions.info' },
    { label: '', labelKey: 'alerts.levels.warning', value: 'WARNING', descriptionKey: 'notificationPreferences.levelDescriptions.warning' },
    { label: '', labelKey: 'alerts.levels.critical', value: 'CRITICAL', descriptionKey: 'notificationPreferences.levelDescriptions.critical' },
  ];
  readonly deliveryModeOptions: DropdownOption[] = [
    { label: '', labelKey: 'notificationPreferences.deliveryModes.banner', value: 'BANNER', descriptionKey: 'notificationPreferences.deliveryModeDescriptions.banner' },
    { label: '', labelKey: 'notificationPreferences.deliveryModes.quiet', value: 'QUIET', descriptionKey: 'notificationPreferences.deliveryModeDescriptions.quiet' },
    { label: '', labelKey: 'notificationPreferences.deliveryModes.inboxOnly', value: 'INBOX_ONLY', descriptionKey: 'notificationPreferences.deliveryModeDescriptions.inboxOnly' },
    { label: '', labelKey: 'notificationPreferences.deliveryModes.muted', value: 'MUTED', descriptionKey: 'notificationPreferences.deliveryModeDescriptions.muted' },
  ];
  readonly signalWeights: SignalWeight[] = [
    {
      source: 'DEVICE',
      label: '',
      labelKey: 'notificationPreferences.sources.device',
      description: '',
      descriptionKey: 'notificationPreferences.sourceDescriptions.device',
      weight: 54,
    },
    {
      source: 'GROUP',
      label: '',
      labelKey: 'notificationPreferences.sources.group',
      description: '',
      descriptionKey: 'notificationPreferences.sourceDescriptions.group',
      weight: 46,
    },
    {
      source: 'ROUTINE',
      label: '',
      labelKey: 'notificationPreferences.sources.routine',
      description: '',
      descriptionKey: 'notificationPreferences.sourceDescriptions.routine',
      weight: 62,
    },
    {
      source: 'GOAL',
      label: '',
      labelKey: 'notificationPreferences.sources.goal',
      description: '',
      descriptionKey: 'notificationPreferences.sourceDescriptions.goal',
      weight: 68,
    },
    {
      source: 'RULE',
      label: '',
      labelKey: 'notificationPreferences.sources.rule',
      description: '',
      descriptionKey: 'notificationPreferences.sourceDescriptions.rule',
      weight: 72,
    },
    {
      source: 'MODE',
      label: '',
      labelKey: 'notificationPreferences.sources.mode',
      description: '',
      descriptionKey: 'notificationPreferences.sourceDescriptions.mode',
      weight: 50,
    },
    {
      source: 'SYSTEM',
      label: '',
      labelKey: 'notificationPreferences.sources.system',
      description: '',
      descriptionKey: 'notificationPreferences.sourceDescriptions.system',
      weight: 36,
    },
  ];

  constructor(private readonly translate: TranslateService) {}

  get severityBands(): NotificationSeverityBand[] {
    return buildNotificationSeverityBands(this.currentClassificationPolicy());
  }

  get visualSeverityBands(): NotificationSeverityBand[] {
    return [...this.severityBands].reverse();
  }

  get previewWeightedScore(): number {
    const signal = this.signalWeights.find((item) => item.source === this.previewSource);
    const weight = signal?.weight ?? 50;
    const enabledAdjustment = this.allowedSourceTypes.has(this.previewSource) ? 0 : -18;

    return this.clamp(Math.round(this.previewScore + (weight - 50) / 2 + enabledAdjustment), 0, 100);
  }

  get previewLevel(): AlertLevel {
    return this.levelForScore(this.previewWeightedScore);
  }

  get previewLabel(): string {
    return this.levelLabel(this.previewLevel);
  }

  get previewSourceOptions(): DropdownOption[] {
    return this.signalWeights.map((signal) => ({
      label: this.signalLabel(signal),
      value: signal.source,
      description: this.t('notificationPreferences.weightDescription', { weight: signal.weight }),
    }));
  }

  updateMinimumLevel(value: string): void {
    this.minimumLevel = value as AlertLevel;
  }

  updateDeliveryMode(value: string): void {
    this.defaultDeliveryMode = value as NotificationDeliveryMode;
  }

  toggleLevel(level: AlertLevel): void {
    this.toggleSetValue(this.allowedLevels, level);
  }

  toggleSource(source: AlertSourceType): void {
    this.toggleSetValue(this.allowedSourceTypes, source);
  }

  updateStableMax(value: string | number): void {
    this.stableMax = this.clamp(this.toNumber(value), 5, 92);
    this.pushThresholdsForward();
    this.emitClassificationPolicy();
  }

  updateNeutralMax(value: string | number): void {
    this.neutralMax = this.clamp(this.toNumber(value), this.stableMax + 5, 96);
    this.pushThresholdsForward();
    this.emitClassificationPolicy();
  }

  updateWarningMax(value: string | number): void {
    this.warningMax = this.clamp(this.toNumber(value), this.neutralMax + 5, 99);
    this.emitClassificationPolicy();
  }

  updatePreviewScore(value: string | number): void {
    this.previewScore = this.clamp(this.toNumber(value), 0, 100);
  }

  updatePreviewSource(value: string): void {
    this.previewSource = value as AlertSourceType;
  }

  updateSignalWeight(signal: SignalWeight, value: string | number): void {
    signal.weight = this.clamp(this.toNumber(value), 0, 100);
  }

  sourceEnabled(source: AlertSourceType): boolean {
    return this.allowedSourceTypes.has(source);
  }

  bandRangeLabel(band: NotificationSeverityBand): string {
    return `${band.from}% - ${band.to}%`;
  }

  levelLabel(level: AlertLevel): string {
    const labels: Record<AlertLevel, string> = {
      STABLE: 'alerts.levels.stable',
      SUCCESS: 'alerts.levels.success',
      INFO: 'alerts.levels.info',
      WARNING: 'alerts.levels.warning',
      CRITICAL: 'alerts.levels.critical',
    };

    return this.t(labels[level]);
  }

  sourceLabel(source: AlertSourceType): string {
    const labels: Record<AlertSourceType, string> = {
      DEVICE: 'notificationPreferences.sources.device',
      GROUP: 'notificationPreferences.sources.group',
      ROOM: 'notificationPreferences.sources.room',
      WORKPLACE: 'notificationPreferences.sources.workplace',
      ROUTINE: 'notificationPreferences.sources.routine',
      GOAL: 'notificationPreferences.sources.goal',
      REPORT: 'notificationPreferences.sources.report',
      RULE: 'notificationPreferences.sources.rule',
      MODE: 'notificationPreferences.sources.mode',
      SYSTEM: 'notificationPreferences.sources.system',
    };

    return this.t(labels[source]);
  }

  signalLabel(signal: SignalWeight): string {
    return this.t(signal.labelKey);
  }

  signalDescription(signal: SignalWeight): string {
    return this.t(signal.descriptionKey);
  }

  bandLabel(band: NotificationSeverityBand): string {
    return this.levelLabel(band.level);
  }

  chipVariant(active: boolean): AppButtonVariant {
    return active ? 'primary' : 'secondary';
  }

  levelClass(level: AlertLevel): string {
    return `level-${level.toLowerCase()}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['classificationPolicy']) {
      this.stableMax = this.classificationPolicy.stableMax;
      this.neutralMax = this.classificationPolicy.neutralMax;
      this.warningMax = this.classificationPolicy.warningMax;
    }

    if (!this.preference) return;

    this.emailEnabled = this.preference.emailEnabled;
    this.pushEnabled = this.preference.pushEnabled;
    this.inAppEnabled = this.preference.inAppEnabled;
    this.toastEnabled = this.preference.toastEnabled;
    this.dashboardEnabled = this.preference.dashboardEnabled;
    this.criticalOnly = this.preference.criticalOnly;
    this.minimumLevel = this.preference.minimumLevel === 'SUCCESS'
      ? 'INFO'
      : this.preference.minimumLevel;
    this.allowedLevels = new Set(this.preference.allowedLevels);
    this.allowedSourceTypes = new Set(this.preference.allowedSourceTypes);
    this.quietHoursEnabled = this.preference.quietHoursEnabled;
    this.quietHoursStart = this.preference.quietHoursStart;
    this.quietHoursEnd = this.preference.quietHoursEnd;
    this.criticalBreaksQuietHours = this.preference.criticalBreaksQuietHours;
    this.groupSimilarAlerts = this.preference.groupSimilarAlerts;
    this.remindersEnabled = this.preference.remindersEnabled;
    this.cooldownMinutes = this.preference.cooldownMinutes;
    this.maxAlertsPerHour = this.preference.maxAlertsPerHour;
    this.routineNightSilence = this.preference.routineNightSilence;
    this.goalDeadlineAlerts = this.preference.goalDeadlineAlerts;
    this.maintenanceDeviceAlerts = this.preference.maintenanceDeviceAlerts;
    this.systemRecommendations = this.preference.systemRecommendations;
    this.dailySummaryEnabled = this.preference.dailySummaryEnabled;
    this.weeklySummaryEnabled = this.preference.weeklySummaryEnabled;
    this.monthlyReportEnabled = this.preference.monthlyReportEnabled;
    this.defaultDeliveryMode = this.preference.defaultDeliveryMode;
  }

  onSubmit(): void {
    this.saved.emit({
      emailEnabled: this.emailEnabled,
      pushEnabled: this.pushEnabled,
      inAppEnabled: this.inAppEnabled,
      toastEnabled: this.toastEnabled,
      dashboardEnabled: this.dashboardEnabled,
      criticalOnly: this.criticalOnly,
      minimumLevel: this.minimumLevel,
      scopeType: 'USER',
      allowedLevels: Array.from(this.allowedLevels).join(','),
      allowedSourceTypes: Array.from(this.allowedSourceTypes).join(','),
      quietHoursEnabled: this.quietHoursEnabled,
      quietHoursStart: this.quietHoursStart,
      quietHoursEnd: this.quietHoursEnd,
      criticalBreaksQuietHours: this.criticalBreaksQuietHours,
      groupSimilarAlerts: this.groupSimilarAlerts,
      remindersEnabled: this.remindersEnabled,
      cooldownMinutes: this.cooldownMinutes,
      maxAlertsPerHour: this.maxAlertsPerHour,
      routineNightSilence: this.routineNightSilence,
      goalDeadlineAlerts: this.goalDeadlineAlerts,
      maintenanceDeviceAlerts: this.maintenanceDeviceAlerts,
      systemRecommendations: this.systemRecommendations,
      dailySummaryEnabled: this.dailySummaryEnabled,
      weeklySummaryEnabled: this.weeklySummaryEnabled,
      monthlyReportEnabled: this.monthlyReportEnabled,
      defaultDeliveryMode: this.defaultDeliveryMode,
    });
  }

  private levelForScore(score: number): AlertLevel {
    return levelForNotificationScore(score, this.currentClassificationPolicy());
  }

  private pushThresholdsForward(): void {
    if (this.neutralMax < this.stableMax + 5) {
      this.neutralMax = this.clamp(this.stableMax + 5, 10, 96);
    }

    if (this.warningMax < this.neutralMax + 5) {
      this.warningMax = this.clamp(this.neutralMax + 5, 15, 99);
    }
  }

  private toNumber(value: string | number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private toggleSetValue<T>(set: Set<T>, value: T): void {
    if (set.has(value) && set.size > 1) {
      set.delete(value);
      return;
    }

    set.add(value);
  }

  private currentClassificationPolicy(): NotificationClassificationPolicy {
    return {
      stableMax: this.stableMax,
      neutralMax: this.neutralMax,
      warningMax: this.warningMax,
    };
  }

  private emitClassificationPolicy(): void {
    this.classificationPolicyChanged.emit(this.currentClassificationPolicy());
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
