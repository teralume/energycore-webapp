import { SupportTicketStatus } from '../../domain/model/support-ticket.entity';

export interface UpdateSupportTicketStatusCommand {
  ticketId: number;
  status: SupportTicketStatus;
}
