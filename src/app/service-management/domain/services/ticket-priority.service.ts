import { Injectable } from '@angular/core';

import {
  SupportTicket,
  SupportTicketPriority,
} from '../model/support-ticket.entity';
import {
  MaintenanceTicket,
  MaintenanceTicketStatus,
} from '../model/maintenance-ticket.entity';

@Injectable({
  providedIn: 'root',
})
export class TicketPriorityService {
  private readonly supportPriorityWeight: Record<SupportTicketPriority, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  private readonly maintenanceStatusWeight: Record<MaintenanceTicketStatus, number> = {
    PENDING: 4,
    SCHEDULED: 3,
    COMPLETED: 2,
    CANCELED: 1,
  };

  sortSupportTickets(tickets: SupportTicket[]): SupportTicket[] {
    return [...tickets].sort((first, second) => {
      const priorityDifference =
        this.supportPriorityWeight[second.priority] -
        this.supportPriorityWeight[first.priority];

      if (priorityDifference !== 0) return priorityDifference;

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });
  }

  sortMaintenanceTickets(tickets: MaintenanceTicket[]): MaintenanceTicket[] {
    return [...tickets].sort((first, second) => {
      const statusDifference =
        this.maintenanceStatusWeight[second.status] -
        this.maintenanceStatusWeight[first.status];

      if (statusDifference !== 0) return statusDifference;

      return (
        new Date(first.scheduledDate).getTime() -
        new Date(second.scheduledDate).getTime()
      );
    });
  }

  getSupportPriorityWeight(priority: SupportTicketPriority): number {
    return this.supportPriorityWeight[priority];
  }

  getMaintenanceStatusWeight(status: MaintenanceTicketStatus): number {
    return this.maintenanceStatusWeight[status];
  }
}