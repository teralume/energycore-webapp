import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { AlertRule } from '../../domain/model/alert-rule.entity';
import { AlertRuleResource } from '../resources/alert-rule.resource';
import { AlertRuleResponse } from '../responses/alert-rule.response';

export class AlertRuleAssembler extends BaseAssembler<
  AlertRule,
  AlertRuleResource,
  AlertRuleResponse
> {
  override toEntity(response: AlertRuleResponse): AlertRule {
    return new AlertRule({
      id: response.id,
      userId: response.userId,
      name: response.name,
      metric: response.metric,
      condition: response.condition ?? response.conditionType ?? 'GREATER_THAN',
      threshold: response.threshold,
      level: response.level ?? 'WARNING',
      scopeType: response.scopeType,
      scopeId: response.scopeId,
      evaluatorType: response.evaluatorType,
      weight: response.weight,
      profileName: response.profileName,
      enabled: response.enabled,
      createdAt: response.createdAt ?? '',
    });
  }

  override toResource(entity: AlertRule): AlertRuleResource {
    return {
      userId: entity.userId,
      name: entity.name,
      metric: entity.metric,
      conditionType: entity.condition,
      threshold: entity.threshold,
      level: entity.level,
      scopeType: entity.scopeType,
      scopeId: entity.scopeId,
      evaluatorType: entity.evaluatorType,
      weight: entity.weight,
      profileName: entity.profileName,
    };
  }
}
