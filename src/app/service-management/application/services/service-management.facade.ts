import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { DeviceControlFacade } from '../../../device-control/application/services/device-control.facade';

import { CreateMaintenanceTicketCommand } from '../commands/create-maintenance-ticket.command';
import { CreateSupportTicketCommand } from '../commands/create-support-ticket.command';
import { UpdateMaintenanceTicketStatusCommand } from '../commands/update-maintenance-ticket-status.command';
import { UpdateSupportTicketStatusCommand } from '../commands/update-support-ticket-status.command';

import { MaintenanceTicketsApiService } from '../../infrastructure/api/maintenance-tickets-api.service';
import { SupportTicketsApiService } from '../../infrastructure/api/support-tickets-api.service';

import { MaintenanceTicketAssembler } from '../../infrastructure/assemblers/maintenance-ticket.assembler';
import { SupportTicketAssembler } from '../../infrastructure/assemblers/support-ticket.assembler';

import { ServiceManagementStore } from '../stores/service-management.store';

@Injectable({
  providedIn: 'root',
})
export class ServiceManagementFacade {
  private readonly supportTicketAssembler = new SupportTicketAssembler();
  private readonly maintenanceTicketAssembler = new MaintenanceTicketAssembler();

  get supportTickets() {
    return this.store.supportTickets;
  }

  get maintenanceTickets() {
    return this.store.maintenanceTickets;
  }

  get sortedSupportTickets() {
    return this.store.sortedSupportTickets;
  }

  get sortedMaintenanceTickets() {
    return this.store.sortedMaintenanceTickets;
  }

  get loading() {
    return this.store.loading;
  }

  get error() {
    return this.store.error;
  }

  get openSupportTickets() {
    return this.store.openSupportTickets;
  }

  get urgentSupportTickets() {
    return this.store.urgentSupportTickets;
  }

  get pendingMaintenanceTickets() {
    return this.store.pendingMaintenanceTickets;
  }

  get scheduledMaintenanceTickets() {
    return this.store.scheduledMaintenanceTickets;
  }

  get completedMaintenanceTickets() {
    return this.store.completedMaintenanceTickets;
  }

  constructor(
    private readonly supportTicketsApi: SupportTicketsApiService,
    private readonly maintenanceTicketsApi: MaintenanceTicketsApiService,
    private readonly deviceControlFacade: DeviceControlFacade,
    private readonly store: ServiceManagementStore
  ) {}

  async loadServiceManagement(): Promise<void> {
    this.startRequest();

    try {
      await Promise.all([
        this.loadSupportTickets(),
        this.loadMaintenanceTickets(),
        this.deviceControlFacade.loadDevices(),
      ]);
    } catch (error) {
      console.error(error);
      this.store.setError('serviceManagement.loadError');
    } finally {
      this.finishRequest();
    }
  }

  async loadSupportTickets(): Promise<void> {
    const responses = await firstValueFrom(
      this.supportTicketsApi.findAllForCurrentUser()
    );

    const tickets = responses
      .map((response) => this.supportTicketAssembler.toEntity(response))
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      );

    this.store.setSupportTickets(tickets);
  }

  async createSupportTicket(command: CreateSupportTicketCommand): Promise<boolean> {
    this.startRequest();

    try {
      if (!command.subject.trim() || !command.description.trim()) {
        this.store.setError('serviceManagement.supportCreateError');
        return false;
      }

      const response = await firstValueFrom(
        this.supportTicketsApi.create({
          subject: command.subject.trim(),
          description: command.description.trim(),
          priority: command.priority,
          status: 'OPEN',
          createdAt: new Date().toISOString().slice(0, 10),
        })
      );

      const ticket = this.supportTicketAssembler.toEntity(response);
      this.store.prependSupportTicket(ticket);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('serviceManagement.supportCreateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async updateSupportTicketStatus(
    command: UpdateSupportTicketStatusCommand
  ): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.supportTicketsApi.updateStatus(command.ticketId, {
          status: command.status,
        })
      );

      const ticket = this.supportTicketAssembler.toEntity(response);
      this.store.updateSupportTicket(ticket);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('serviceManagement.supportUpdateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async deleteSupportTicket(ticketId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.supportTicketsApi.delete(ticketId));
      this.store.removeSupportTicket(ticketId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('serviceManagement.supportDeleteError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async loadMaintenanceTickets(): Promise<void> {
    const responses = await firstValueFrom(
      this.maintenanceTicketsApi.findAllForCurrentUser()
    );

    const tickets = responses
      .map((response) => this.maintenanceTicketAssembler.toEntity(response))
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      );

    this.store.setMaintenanceTickets(tickets);
  }

  async createMaintenanceTicket(
    command: CreateMaintenanceTicketCommand
  ): Promise<boolean> {
    this.startRequest();

    try {
      if (
        !command.deviceId ||
        !command.deviceName.trim() ||
        !command.description.trim() ||
        !command.scheduledDate
      ) {
        this.store.setError('serviceManagement.maintenanceCreateError');
        return false;
      }

      const response = await firstValueFrom(
        this.maintenanceTicketsApi.create({
          deviceId: Number(command.deviceId),
          deviceName: command.deviceName.trim(),
          type: command.type,
          description: command.description.trim(),
          scheduledDate: command.scheduledDate,
          status: 'PENDING',
          createdAt: new Date().toISOString().slice(0, 10),
        })
      );

      const ticket = this.maintenanceTicketAssembler.toEntity(response);
      this.store.prependMaintenanceTicket(ticket);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('serviceManagement.maintenanceCreateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async updateMaintenanceTicketStatus(
    command: UpdateMaintenanceTicketStatusCommand
  ): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.maintenanceTicketsApi.updateStatus(command.ticketId, {
          status: command.status,
        })
      );

      const ticket = this.maintenanceTicketAssembler.toEntity(response);
      this.store.updateMaintenanceTicket(ticket);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('serviceManagement.maintenanceUpdateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async deleteMaintenanceTicket(ticketId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.maintenanceTicketsApi.delete(ticketId));
      this.store.removeMaintenanceTicket(ticketId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('serviceManagement.maintenanceDeleteError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  getDeviceName(deviceId: number): string {
    return this.deviceControlFacade.getDeviceName(deviceId);
  }

  clearMessages(): void {
    this.store.clearMessages();
  }

  private startRequest(): void {
    this.store.setLoading(true);
    this.store.clearMessages();
  }

  private finishRequest(): void {
    this.store.setLoading(false);
  }
}
