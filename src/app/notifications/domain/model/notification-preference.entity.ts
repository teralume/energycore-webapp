import { BaseEntity } from '../../../shared/domain/model/base.entity';
import { AlertLevel, AlertSourceType } from './alert.entity';

export type NotificationDeliveryMode = 'BANNER' | 'QUIET' | 'INBOX_ONLY' | 'MUTED';
export type NotificationPreferenceScope = 'USER' | 'WORKPLACE';

export class NotificationPreference extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _emailEnabled: boolean;
  private readonly _pushEnabled: boolean;
  private readonly _inAppEnabled: boolean;
  private readonly _toastEnabled: boolean;
  private readonly _dashboardEnabled: boolean;
  private readonly _criticalOnly: boolean;
  private readonly _minimumLevel: AlertLevel;
  private readonly _scopeType: NotificationPreferenceScope;
  private readonly _scopeId: string | null;
  private readonly _allowedLevels: AlertLevel[];
  private readonly _allowedSourceTypes: AlertSourceType[];
  private readonly _quietHoursEnabled: boolean;
  private readonly _quietHoursStart: string;
  private readonly _quietHoursEnd: string;
  private readonly _criticalBreaksQuietHours: boolean;
  private readonly _groupSimilarAlerts: boolean;
  private readonly _remindersEnabled: boolean;
  private readonly _cooldownMinutes: number;
  private readonly _maxAlertsPerHour: number;
  private readonly _routineNightSilence: boolean;
  private readonly _goalDeadlineAlerts: boolean;
  private readonly _maintenanceDeviceAlerts: boolean;
  private readonly _systemRecommendations: boolean;
  private readonly _dailySummaryEnabled: boolean;
  private readonly _weeklySummaryEnabled: boolean;
  private readonly _monthlyReportEnabled: boolean;
  private readonly _defaultDeliveryMode: NotificationDeliveryMode;

  constructor(props: {
    id: number;
    userId: number;
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled?: boolean;
    toastEnabled?: boolean;
    dashboardEnabled?: boolean;
    criticalOnly: boolean;
    minimumLevel: AlertLevel;
    scopeType?: NotificationPreferenceScope;
    scopeId?: string | null;
    allowedLevels?: string | AlertLevel[];
    allowedSourceTypes?: string | AlertSourceType[];
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
  }) {
    super(props.id);
    this._userId = props.userId;
    this._emailEnabled = props.emailEnabled;
    this._pushEnabled = props.pushEnabled;
    this._inAppEnabled = props.inAppEnabled ?? true;
    this._toastEnabled = props.toastEnabled ?? true;
    this._dashboardEnabled = props.dashboardEnabled ?? true;
    this._criticalOnly = props.criticalOnly;
    this._minimumLevel = props.minimumLevel;
    this._scopeType = props.scopeType ?? 'USER';
    this._scopeId = props.scopeId ?? null;
    this._allowedLevels = this.parseList<AlertLevel>(
      props.allowedLevels,
      ['STABLE', 'INFO', 'WARNING', 'CRITICAL', 'SUCCESS']
    );
    this._allowedSourceTypes = this.parseList<AlertSourceType>(
      props.allowedSourceTypes,
      ['DEVICE', 'GROUP', 'ROOM', 'WORKPLACE', 'ROUTINE', 'GOAL', 'REPORT', 'RULE', 'MODE', 'SYSTEM']
    );
    this._quietHoursEnabled = props.quietHoursEnabled ?? false;
    this._quietHoursStart = props.quietHoursStart ?? '22:00';
    this._quietHoursEnd = props.quietHoursEnd ?? '07:00';
    this._criticalBreaksQuietHours = props.criticalBreaksQuietHours ?? true;
    this._groupSimilarAlerts = props.groupSimilarAlerts ?? true;
    this._remindersEnabled = props.remindersEnabled ?? true;
    this._cooldownMinutes = props.cooldownMinutes ?? 10;
    this._maxAlertsPerHour = props.maxAlertsPerHour ?? 12;
    this._routineNightSilence = props.routineNightSilence ?? true;
    this._goalDeadlineAlerts = props.goalDeadlineAlerts ?? true;
    this._maintenanceDeviceAlerts = props.maintenanceDeviceAlerts ?? false;
    this._systemRecommendations = props.systemRecommendations ?? true;
    this._dailySummaryEnabled = props.dailySummaryEnabled ?? true;
    this._weeklySummaryEnabled = props.weeklySummaryEnabled ?? false;
    this._monthlyReportEnabled = props.monthlyReportEnabled ?? true;
    this._defaultDeliveryMode = props.defaultDeliveryMode ?? 'BANNER';
  }

  get userId(): number {
    return this._userId;
  }

  get emailEnabled(): boolean {
    return this._emailEnabled;
  }

  get pushEnabled(): boolean {
    return this._pushEnabled;
  }

  get inAppEnabled(): boolean {
    return this._inAppEnabled;
  }

  get toastEnabled(): boolean {
    return this._toastEnabled;
  }

  get dashboardEnabled(): boolean {
    return this._dashboardEnabled;
  }

  get criticalOnly(): boolean {
    return this._criticalOnly;
  }

  get minimumLevel(): AlertLevel {
    return this._minimumLevel;
  }

  get scopeType(): NotificationPreferenceScope {
    return this._scopeType;
  }

  get scopeId(): string | null {
    return this._scopeId;
  }

  get allowedLevels(): AlertLevel[] {
    return this._allowedLevels;
  }

  get allowedSourceTypes(): AlertSourceType[] {
    return this._allowedSourceTypes;
  }

  get quietHoursEnabled(): boolean {
    return this._quietHoursEnabled;
  }

  get quietHoursStart(): string {
    return this._quietHoursStart;
  }

  get quietHoursEnd(): string {
    return this._quietHoursEnd;
  }

  get criticalBreaksQuietHours(): boolean {
    return this._criticalBreaksQuietHours;
  }

  get groupSimilarAlerts(): boolean {
    return this._groupSimilarAlerts;
  }

  get remindersEnabled(): boolean {
    return this._remindersEnabled;
  }

  get cooldownMinutes(): number {
    return this._cooldownMinutes;
  }

  get maxAlertsPerHour(): number {
    return this._maxAlertsPerHour;
  }

  get routineNightSilence(): boolean {
    return this._routineNightSilence;
  }

  get goalDeadlineAlerts(): boolean {
    return this._goalDeadlineAlerts;
  }

  get maintenanceDeviceAlerts(): boolean {
    return this._maintenanceDeviceAlerts;
  }

  get systemRecommendations(): boolean {
    return this._systemRecommendations;
  }

  get dailySummaryEnabled(): boolean {
    return this._dailySummaryEnabled;
  }

  get weeklySummaryEnabled(): boolean {
    return this._weeklySummaryEnabled;
  }

  get monthlyReportEnabled(): boolean {
    return this._monthlyReportEnabled;
  }

  get defaultDeliveryMode(): NotificationDeliveryMode {
    return this._defaultDeliveryMode;
  }

  get hasAnyChannelEnabled(): boolean {
    return this._emailEnabled || this._pushEnabled || this._inAppEnabled || this._toastEnabled || this._dashboardEnabled;
  }

  allowsLevel(level: AlertLevel): boolean {
    if (this._criticalOnly) return level === 'CRITICAL';
    return this._allowedLevels.includes(level);
  }

  allowsSource(sourceType: AlertSourceType): boolean {
    return this._allowedSourceTypes.includes(sourceType);
  }

  private parseList<T extends string>(value: string | T[] | undefined, fallback: T[]): T[] {
    if (Array.isArray(value)) return value;
    if (!value) return fallback;
    const parsed = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean) as T[];
    return parsed.length ? parsed : fallback;
  }
}
