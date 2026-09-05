import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { Alert } from '../../domain/model/alert.entity';
import { AlertResource } from '../resources/alert.resource';
import { AlertResponse } from '../responses/alert.response';

export class AlertAssembler extends BaseAssembler<
  Alert,
  AlertResource,
  AlertResponse
> {
  override toEntity(response: AlertResponse): Alert {
    return new Alert({
      id: response.id,
      userId: response.userId,
      title: response.title,
      message: response.message,
      level: response.level,
      sourceType: response.sourceType,
      sourceId: response.sourceId,
      sourceLabel: response.sourceLabel,
      eventType: response.eventType,
      threadKey: response.threadKey,
      evidence: response.evidence,
      explanation: response.explanation,
      recommendedAction: response.recommendedAction,
      severityScore: response.severityScore,
      repeatCount: response.repeatCount,
      active: response.active,
      resolved: response.resolved,
      read: response.read ?? response.readStatus ?? false,
      createdAt: response.createdAt ?? new Date().toISOString().slice(0, 10),
      firstDetectedAt: response.firstDetectedAt,
      lastTriggeredAt: response.lastTriggeredAt,
      dismissedUntil: response.dismissedUntil,
      expiresAt: response.expiresAt,
      expired: response.expired,
      silenced: response.silenced,
    });
  }

  override toResource(entity: Alert): AlertResource {
    return {
      userId: entity.userId,
      title: entity.title,
      message: entity.message,
      level: entity.level,
      sourceType: entity.sourceType,
      sourceId: entity.sourceId,
      sourceLabel: entity.sourceLabel,
      eventType: entity.eventType,
      threadKey: entity.threadKey,
      evidence: entity.evidence,
      explanation: entity.explanation,
      recommendedAction: entity.recommendedAction,
      severityScore: entity.severityScore,
      repeatCount: entity.repeatCount,
      active: entity.active,
      resolved: entity.resolved,
      read: entity.read,
      createdAt: entity.createdAt,
      firstDetectedAt: entity.firstDetectedAt,
      lastTriggeredAt: entity.lastTriggeredAt,
      dismissedUntil: entity.dismissedUntil,
      expiresAt: entity.expiresAt,
      expired: entity.expired,
      silenced: entity.silenced,
    };
  }
}
