import { AlertEventType, AlertLevel, AlertSourceType } from '../../domain/model/alert.entity';
import { RuleScopeType } from '../../domain/model/alert-rule.entity';

export interface RuleEvaluationResultResponse {
  userId: number;
  scopeType: RuleScopeType;
  scopeId?: string | null;
  level: AlertLevel;
  severityScore: number;
  evidence: string;
  explanation: string;
  recommendedAction: string;
  sourceType: AlertSourceType;
  sourceId?: string | null;
  eventType: AlertEventType;
  threadKey: string;
  activeEvaluatorCount: number;
  totalWeight: number;
}
