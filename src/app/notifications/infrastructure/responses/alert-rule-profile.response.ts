import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import { RuleScopeType } from '../../domain/model/alert-rule.entity';
import { RuleProfileMode, RuleSensitivity } from '../../domain/model/alert-rule-profile.entity';

export interface AlertRuleProfileResponse extends BaseResponse<number> {
  userId: number;
  name: string;
  description: string;
  scopeType: RuleScopeType;
  scopeId?: string | null;
  mode: RuleProfileMode;
  sensitivity: RuleSensitivity;
  active: boolean;
}
