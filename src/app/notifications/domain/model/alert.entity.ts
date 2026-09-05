import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type AlertLevel = 'STABLE' | 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
export type AlertSourceType =
  | 'DEVICE'
  | 'GROUP'
  | 'ROOM'
  | 'WORKPLACE'
  | 'ROUTINE'
  | 'GOAL'
  | 'REPORT'
  | 'SYSTEM'
  | 'RULE'
  | 'MODE';
export type AlertEventType =
  | 'MANUAL'
  | 'CONSUMPTION_REVIEW'
  | 'DEVICE_STATUS'
  | 'GROUP_STATUS'
  | 'ROOM_ACTIVITY'
  | 'WORKPLACE_ACTIVITY'
  | 'ROUTINE_UPCOMING'
  | 'ROUTINE_EXECUTED'
  | 'ROUTINE_FAILED'
  | 'ROUTINE_DISABLED'
  | 'GOAL_PROGRESS'
  | 'GOAL_DEADLINE'
  | 'GOAL_EXCEEDED'
  | 'GOAL_COMPLETED'
  | 'REPORT_SUMMARY'
  | 'RULE_EVALUATION'
  | 'SYSTEM_STATUS'
  | 'MODE_ACTIVITY';

export class Alert extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _title: string;
  private readonly _message: string;
  private readonly _level: AlertLevel;
  private readonly _sourceType: AlertSourceType;
  private readonly _sourceId: string | null;
  private readonly _sourceLabel: string | null;
  private readonly _eventType: AlertEventType;
  private readonly _threadKey: string;
  private readonly _evidence: string | null;
  private readonly _explanation: string | null;
  private readonly _recommendedAction: string | null;
  private readonly _severityScore: number;
  private readonly _repeatCount: number;
  private readonly _active: boolean;
  private readonly _resolved: boolean;
  private readonly _read: boolean;
  private readonly _createdAt: string;
  private readonly _firstDetectedAt: string | null;
  private readonly _lastTriggeredAt: string | null;
  private readonly _dismissedUntil: string | null;
  private readonly _expiresAt: string | null;
  private readonly _expired: boolean;
  private readonly _silenced: boolean;

  constructor(props: {
    id: number;
    userId: number;
    title: string;
    message: string;
    level: AlertLevel;
    sourceType?: AlertSourceType;
    sourceId?: string | null;
    sourceLabel?: string | null;
    eventType?: AlertEventType;
    threadKey?: string;
    evidence?: string | null;
    explanation?: string | null;
    recommendedAction?: string | null;
    severityScore?: number;
    repeatCount?: number;
    active?: boolean;
    resolved?: boolean;
    read: boolean;
    createdAt: string;
    firstDetectedAt?: string | null;
    lastTriggeredAt?: string | null;
    dismissedUntil?: string | null;
    expiresAt?: string | null;
    expired?: boolean;
    silenced?: boolean;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._title = props.title;
    this._message = props.message;
    this._level = props.level;
    this._sourceType = props.sourceType ?? 'SYSTEM';
    this._sourceId = props.sourceId ?? null;
    this._sourceLabel = props.sourceLabel ?? null;
    this._eventType = props.eventType ?? 'MANUAL';
    this._threadKey = props.threadKey ?? `SYSTEM:GLOBAL:ALERT:${props.id}`;
    this._evidence = props.evidence ?? null;
    this._explanation = props.explanation ?? null;
    this._recommendedAction = props.recommendedAction ?? null;
    this._severityScore = props.severityScore ?? this.defaultSeverityScore(props.level);
    this._repeatCount = props.repeatCount ?? 1;
    this._active = props.active ?? true;
    this._resolved = props.resolved ?? false;
    this._read = props.read;
    this._createdAt = props.createdAt;
    this._firstDetectedAt = props.firstDetectedAt ?? null;
    this._lastTriggeredAt = props.lastTriggeredAt ?? null;
    this._dismissedUntil = props.dismissedUntil ?? null;
    this._expiresAt = props.expiresAt ?? null;
    this._expired = props.expired ?? false;
    this._silenced = props.silenced ?? false;
  }

  get userId(): number {
    return this._userId;
  }

  get title(): string {
    return this._title;
  }

  get message(): string {
    return this._message;
  }

  get level(): AlertLevel {
    return this._level;
  }

  get sourceType(): AlertSourceType {
    return this._sourceType;
  }

  get sourceId(): string | null {
    return this._sourceId;
  }

  get sourceLabel(): string | null {
    return this._sourceLabel;
  }

  get eventType(): AlertEventType {
    return this._eventType;
  }

  get threadKey(): string {
    return this._threadKey;
  }

  get evidence(): string | null {
    return this._evidence;
  }

  get explanation(): string | null {
    return this._explanation;
  }

  get recommendedAction(): string | null {
    return this._recommendedAction;
  }

  get severityScore(): number {
    return this._severityScore;
  }

  get repeatCount(): number {
    return this._repeatCount;
  }

  get active(): boolean {
    return this._active;
  }

  get resolved(): boolean {
    return this._resolved;
  }

  get read(): boolean {
    return this._read;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get firstDetectedAt(): string | null {
    return this._firstDetectedAt;
  }

  get lastTriggeredAt(): string | null {
    return this._lastTriggeredAt;
  }

  get dismissedUntil(): string | null {
    return this._dismissedUntil;
  }

  get expiresAt(): string | null {
    return this._expiresAt;
  }

  get expired(): boolean {
    return this._expired;
  }

  get silenced(): boolean {
    return this._silenced;
  }

  get isUnread(): boolean {
    return !this._read;
  }

  get isCritical(): boolean {
    return this._level === 'CRITICAL';
  }

  get isWarning(): boolean {
    return this._level === 'WARNING';
  }

  get isInfo(): boolean {
    return this._level === 'INFO';
  }

  get isStable(): boolean {
    return this._level === 'STABLE';
  }

  get isSuccess(): boolean {
    return this._level === 'SUCCESS';
  }

  private defaultSeverityScore(level: AlertLevel): number {
    const scores: Record<AlertLevel, number> = {
      STABLE: 12,
      SUCCESS: 14,
      INFO: 37,
      WARNING: 63,
      CRITICAL: 88,
    };

    return scores[level];
  }
}
