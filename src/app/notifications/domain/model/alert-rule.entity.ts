import { BaseEntity } from '../../../shared/domain/model/base.entity';
import { AlertLevel } from './alert.entity';

export type AlertRuleMetric = 'WATTS' | 'HIGH_READING_COUNT' | 'AVERAGE_WATTS';
export type AlertRuleCondition = 'GREATER_THAN' | 'GREATER_OR_EQUAL_THAN';
export type RuleScopeType = 'GENERAL' | 'WORKPLACE' | 'ROOM' | 'DEVICE' | 'GROUP' | 'ROUTINE' | 'GOAL';
export type RuleEvaluatorType =
  | 'DAILY_KWH'
  | 'AVERAGE_WATTS'
  | 'ACTIVE_POWER'
  | 'HIGH_READING_COUNT'
  | 'SUSTAINED_CONSUMPTION'
  | 'DEVICE_COUNT'
  | 'GOAL_USAGE'
  | 'GOAL_DEADLINE'
  | 'ROUTINE_CONTEXT'
  | 'COST_ESTIMATE'
  | 'CONFIGURATION_COVERAGE';

export class AlertRule extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _name: string;
  private readonly _metric: AlertRuleMetric;
  private readonly _condition: AlertRuleCondition;
  private readonly _threshold: number;
  private readonly _level: AlertLevel;
  private readonly _scopeType: RuleScopeType;
  private readonly _scopeId: string | null;
  private readonly _evaluatorType: RuleEvaluatorType;
  private readonly _weight: number;
  private readonly _profileName: string;
  private readonly _enabled: boolean;
  private readonly _createdAt: string;

  constructor(props: {
    id: number;
    userId: number;
    name: string;
    metric: AlertRuleMetric;
    condition: AlertRuleCondition;
    threshold: number;
    level: AlertLevel;
    scopeType?: RuleScopeType;
    scopeId?: string | null;
    evaluatorType?: RuleEvaluatorType;
    weight?: number;
    profileName?: string;
    enabled: boolean;
    createdAt: string;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._name = props.name;
    this._metric = props.metric;
    this._condition = props.condition;
    this._threshold = props.threshold;
    this._level = props.level;
    this._scopeType = props.scopeType ?? 'GENERAL';
    this._scopeId = props.scopeId ?? null;
    this._evaluatorType = props.evaluatorType ?? 'ACTIVE_POWER';
    this._weight = props.weight ?? 10;
    this._profileName = props.profileName ?? 'General';
    this._enabled = props.enabled;
    this._createdAt = props.createdAt;
  }

  get userId(): number {
    return this._userId;
  }

  get name(): string {
    return this._name;
  }

  get metric(): AlertRuleMetric {
    return this._metric;
  }

  get condition(): AlertRuleCondition {
    return this._condition;
  }

  get threshold(): number {
    return this._threshold;
  }

  get level(): AlertLevel {
    return this._level;
  }

  get scopeType(): RuleScopeType {
    return this._scopeType;
  }

  get scopeId(): string | null {
    return this._scopeId;
  }

  get evaluatorType(): RuleEvaluatorType {
    return this._evaluatorType;
  }

  get weight(): number {
    return this._weight;
  }

  get profileName(): string {
    return this._profileName;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get isEnabled(): boolean {
    return this._enabled;
  }
}
