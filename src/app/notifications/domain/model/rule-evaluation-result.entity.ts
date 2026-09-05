import { AlertEventType, AlertLevel, AlertSourceType } from './alert.entity';
import { RuleScopeType } from './alert-rule.entity';

export interface RuleEvaluationResult {
  userId: number;
  scopeType: RuleScopeType;
  scopeId: string | null;
  level: AlertLevel;
  severityScore: number;
  evidence: string;
  explanation: string;
  recommendedAction: string;
  sourceType: AlertSourceType;
  sourceId: string | null;
  eventType: AlertEventType;
  threadKey: string;
  activeEvaluatorCount: number;
  totalWeight: number;
}
