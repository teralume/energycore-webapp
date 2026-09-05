import { MaintenanceTicketType } from '../../domain/model/maintenance-ticket.entity';

export interface CreateMaintenanceTicketCommand {
  deviceId: number;
  deviceName: string;
  type: MaintenanceTicketType;
  description: string;
  scheduledDate: string;
}
