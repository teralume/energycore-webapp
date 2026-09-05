import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import {
  AlertRuleCondition,
  AlertRuleMetric,
  RuleEvaluatorType,
  RuleScopeType,
} from '../../domain/model/alert-rule.entity';
import { AlertLevel } from '../../domain/model/alert.entity';

export interface AlertRuleResource extends BaseResource {
  userId?: number;
  name: string;
  metric: AlertRuleMetric;
  conditionType: AlertRuleCondition;
  threshold: number;
  level?: AlertLevel;
  scopeType?: RuleScopeType;
  scopeId?: string | null;
  evaluatorType?: RuleEvaluatorType;
  weight?: number;
  profileName?: string;
}
