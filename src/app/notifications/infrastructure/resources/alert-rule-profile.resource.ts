import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import { RuleScopeType } from '../../domain/model/alert-rule.entity';
import { RuleProfileMode, RuleSensitivity } from '../../domain/model/alert-rule-profile.entity';

export interface AlertRuleProfileResource extends BaseResource {
  userId?: number;
  name: string;
  description?: string;
  scopeType?: RuleScopeType;
  scopeId?: string | null;
  mode?: RuleProfileMode;
  sensitivity?: RuleSensitivity;
}
