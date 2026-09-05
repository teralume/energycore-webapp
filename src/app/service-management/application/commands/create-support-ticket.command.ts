import { SupportTicketPriority } from '../../domain/model/support-ticket.entity';

export interface CreateSupportTicketCommand {
  subject: string;
  description: string;
  priority: SupportTicketPriority;
}
