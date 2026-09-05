import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import { AlertLevel } from '../../domain/model/alert.entity';
import {
  AlertRuleCondition,
  AlertRuleMetric,
  RuleEvaluatorType,
  RuleScopeType,
} from '../../domain/model/alert-rule.entity';

export interface AlertRuleResponse extends BaseResponse<number> {
  userId: number;
  name: string;
  metric: AlertRuleMetric;
  condition?: AlertRuleCondition;
  conditionType?: AlertRuleCondition;
  threshold: number;
  level?: AlertLevel;
  scopeType?: RuleScopeType;
  scopeId?: string | null;
  evaluatorType?: RuleEvaluatorType;
  weight?: number;
  profileName?: string;
  enabled: boolean;
  createdAt?: string;
}
