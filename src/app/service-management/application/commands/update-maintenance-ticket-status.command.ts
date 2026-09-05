import { MaintenanceTicketStatus } from '../../domain/model/maintenance-ticket.entity';

export interface UpdateMaintenanceTicketStatusCommand {
  ticketId: number;
  status: MaintenanceTicketStatus;
}
