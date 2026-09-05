import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { SupportTicket } from '../../domain/model/support-ticket.entity';
import { SupportTicketResource } from '../resources/support-ticket.resource';
import { SupportTicketResponse } from '../responses/support-ticket.response';

export class SupportTicketAssembler extends BaseAssembler<
  SupportTicket,
  SupportTicketResource,
  SupportTicketResponse
> {
  override toEntity(response: SupportTicketResponse): SupportTicket {
    return new SupportTicket({
      id: response.id,
      userId: response.userId,
      subject: response.subject,
      description: response.description,
      priority: response.priority,
      status: response.status,
      createdAt: this.resolveCreatedAt(response.createdAt),
    });
  }

  override toResource(entity: SupportTicket): SupportTicketResource {
    return {
      userId: entity.userId,
      subject: entity.subject,
      description: entity.description,
      priority: entity.priority,
      status: entity.status,
      createdAt: entity.createdAt,
    };
  }

  private resolveCreatedAt(value?: string | null): string {
    return value?.trim() || new Date().toISOString().slice(0, 10);
  }
}
