import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import {
  MaintenanceTicketStatus,
  MaintenanceTicketType,
} from '../../domain/model/maintenance-ticket.entity';

export interface MaintenanceTicketResponse extends BaseResponse<number> {
  userId: number;
  deviceId: number;
  deviceName: string;
  type: MaintenanceTicketType;
  description: string;
  scheduledDate: string;
  status: MaintenanceTicketStatus;
  createdAt: string;
}