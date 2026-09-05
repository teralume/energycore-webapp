import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import {
  SupportTicketPriority,
  SupportTicketStatus,
} from '../../domain/model/support-ticket.entity';

export interface SupportTicketResource extends BaseResource {
  userId?: number;
  subject: string;
  description: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  createdAt?: string | null;
}
