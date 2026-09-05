import { AlertLevel } from '../../domain/model/alert.entity';
import {
  AlertRuleCondition,
  AlertRuleMetric,
  RuleEvaluatorType,
  RuleScopeType,
} from '../../domain/model/alert-rule.entity';

export interface CreateAlertRuleCommand {
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
}
