import { RuleScopeType } from '../../domain/model/alert-rule.entity';

export interface EvaluateAlertRulesResource {
  scopeType?: RuleScopeType;
  scopeId?: string | null;
  observedValue?: number;
}
