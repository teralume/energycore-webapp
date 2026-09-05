import { Injectable, computed, signal } from '@angular/core';

import { MaintenanceTicket } from '../../domain/model/maintenance-ticket.entity';
import { SupportTicket } from '../../domain/model/support-ticket.entity';
import { TicketPriorityService } from '../../domain/services/ticket-priority.service';

@Injectable({
  providedIn: 'root',
})
export class ServiceManagementStore {
  private readonly supportTicketsSignal = signal<SupportTicket[]>([]);
  private readonly maintenanceTicketsSignal = signal<MaintenanceTicket[]>([]);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly supportTickets = computed(() => this.supportTicketsSignal());
  readonly maintenanceTickets = computed(() => this.maintenanceTicketsSignal());

  readonly sortedSupportTickets = computed(() =>
    this.ticketPriorityService.sortSupportTickets(this.supportTicketsSignal())
  );

  readonly sortedMaintenanceTickets = computed(() =>
    this.ticketPriorityService.sortMaintenanceTickets(
      this.maintenanceTicketsSignal()
    )
  );

  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly openSupportTickets = computed(() =>
    this.supportTicketsSignal().filter((ticket) => ticket.isOpen)
  );

  readonly urgentSupportTickets = computed(() =>
    this.supportTicketsSignal().filter((ticket) => ticket.isUrgent)
  );

  readonly pendingMaintenanceTickets = computed(() =>
    this.maintenanceTicketsSignal().filter((ticket) => ticket.isPending)
  );

  readonly scheduledMaintenanceTickets = computed(() =>
    this.maintenanceTicketsSignal().filter((ticket) => ticket.isScheduled)
  );

  readonly completedMaintenanceTickets = computed(() =>
    this.maintenanceTicketsSignal().filter((ticket) => ticket.isCompleted)
  );

  constructor(private readonly ticketPriorityService: TicketPriorityService) {}

  setSupportTickets(value: SupportTicket[]): void {
    this.supportTicketsSignal.set(value);
  }

  prependSupportTicket(value: SupportTicket): void {
    this.supportTicketsSignal.update((tickets) => [value, ...tickets]);
  }

  updateSupportTicket(value: SupportTicket): void {
    this.supportTicketsSignal.update((tickets) =>
      tickets.map((ticket) => (ticket.id === value.id ? value : ticket))
    );
  }

  removeSupportTicket(ticketId: number): void {
    this.supportTicketsSignal.update((tickets) =>
      tickets.filter((ticket) => ticket.id !== ticketId)
    );
  }

  setMaintenanceTickets(value: MaintenanceTicket[]): void {
    this.maintenanceTicketsSignal.set(value);
  }

  prependMaintenanceTicket(value: MaintenanceTicket): void {
    this.maintenanceTicketsSignal.update((tickets) => [value, ...tickets]);
  }

  updateMaintenanceTicket(value: MaintenanceTicket): void {
    this.maintenanceTicketsSignal.update((tickets) =>
      tickets.map((ticket) => (ticket.id === value.id ? value : ticket))
    );
  }

  removeMaintenanceTicket(ticketId: number): void {
    this.maintenanceTicketsSignal.update((tickets) =>
      tickets.filter((ticket) => ticket.id !== ticketId)
    );
  }

  setLoading(value: boolean): void {
    this.loadingSignal.set(value);
  }

  setError(value: string | null): void {
    this.errorSignal.set(value);
  }

  clearMessages(): void {
    this.errorSignal.set(null);
  }

  reset(): void {
    this.supportTicketsSignal.set([]);
    this.maintenanceTicketsSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
