import { BaseEntity } from '../../../shared/domain/model/base.entity';
import { RuleScopeType } from './alert-rule.entity';

export type RuleProfileMode = 'BALANCED' | 'SAVINGS' | 'PROTECTION';
export type RuleSensitivity = 'LOW' | 'NORMAL' | 'HIGH' | 'STRICT';

export class AlertRuleProfile extends BaseEntity<number> {
  constructor(
    props: {
      id: number;
      userId: number;
      name: string;
      description: string;
      scopeType: RuleScopeType;
      scopeId: string | null;
      mode: RuleProfileMode;
      sensitivity: RuleSensitivity;
      active: boolean;
    }
  ) {
    super(props.id);
    this.userId = props.userId;
    this.name = props.name;
    this.description = props.description;
    this.scopeType = props.scopeType;
    this.scopeId = props.scopeId;
    this.mode = props.mode;
    this.sensitivity = props.sensitivity;
    this.active = props.active;
  }

  readonly userId: number;
  readonly name: string;
  readonly description: string;
  readonly scopeType: RuleScopeType;
  readonly scopeId: string | null;
  readonly mode: RuleProfileMode;
  readonly sensitivity: RuleSensitivity;
  readonly active: boolean;
}
