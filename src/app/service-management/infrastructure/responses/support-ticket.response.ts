import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import {
  SupportTicketPriority,
  SupportTicketStatus,
} from '../../domain/model/support-ticket.entity';

export interface SupportTicketResponse extends BaseResponse<number> {
  userId: number;
  subject: string;
  description: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  createdAt?: string | null;
}
