import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { MaintenanceTicket } from '../../domain/model/maintenance-ticket.entity';
import { MaintenanceTicketResource } from '../resources/maintenance-ticket.resource';
import { MaintenanceTicketResponse } from '../responses/maintenance-ticket.response';

export class MaintenanceTicketAssembler extends BaseAssembler<
  MaintenanceTicket,
  MaintenanceTicketResource,
  MaintenanceTicketResponse
> {
  override toEntity(response: MaintenanceTicketResponse): MaintenanceTicket {
    return new MaintenanceTicket({
      id: response.id,
      userId: response.userId,
      deviceId: response.deviceId,
      deviceName: response.deviceName,
      type: response.type,
      description: response.description,
      scheduledDate: response.scheduledDate,
      status: response.status,
      createdAt: response.createdAt,
    });
  }

  override toResource(entity: MaintenanceTicket): MaintenanceTicketResource {
    return {
      userId: entity.userId,
      deviceId: entity.deviceId,
      deviceName: entity.deviceName,
      type: entity.type,
      description: entity.description,
      scheduledDate: entity.scheduledDate,
      status: entity.status,
      createdAt: entity.createdAt,
    };
  }
}