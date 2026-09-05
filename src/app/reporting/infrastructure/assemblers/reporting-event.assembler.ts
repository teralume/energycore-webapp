import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { ReportingEvent } from '../../domain/model/reporting-event.entity';
import { ReportingEventResource } from '../resources/reporting-event.resource';
import { ReportingEventResponse } from '../responses/reporting-event.response';

export class ReportingEventAssembler extends BaseAssembler<
  ReportingEvent,
  ReportingEventResource,
  ReportingEventResponse
> {
  override toEntity(response: ReportingEventResponse): ReportingEvent {
    return new ReportingEvent({
      id: response.id,
      eventName: response.eventName,
      sourceContext: response.sourceContext,
      subjectType: response.subjectType,
      subjectId: response.subjectId,
      summary: response.summary,
      detail: response.detail,
      occurredOn: response.occurredOn,
    });
  }

  override toResource(entity: ReportingEvent): ReportingEventResource {
    return {
      eventName: entity.eventName,
      sourceContext: entity.sourceContext,
      subjectType: entity.subjectType,
      subjectId: entity.subjectId,
      summary: entity.summary,
      detail: entity.detail,
      occurredOn: entity.occurredOn,
    };
  }
}
