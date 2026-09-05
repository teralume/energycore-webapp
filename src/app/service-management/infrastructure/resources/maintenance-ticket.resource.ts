import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import {
  MaintenanceTicketStatus,
  MaintenanceTicketType,
} from '../../domain/model/maintenance-ticket.entity';

export interface MaintenanceTicketResource extends BaseResource {
  userId?: number;
  deviceId: number;
  deviceName: string;
  type: MaintenanceTicketType;
  description: string;
  scheduledDate: string;
  status: MaintenanceTicketStatus;
  createdAt: string;
}
