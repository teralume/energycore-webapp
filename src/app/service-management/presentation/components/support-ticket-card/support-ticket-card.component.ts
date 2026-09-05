import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import {
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../../../domain/model/support-ticket.entity';
import { TicketStatusBadgeComponent } from '../ticket-status-badge/ticket-status-badge.component';

@Component({
  selector: 'app-support-ticket-card',
  standalone: true,
  imports: [
    TranslateModule,
    AppButtonComponent,
    AppDropdownComponent,
    TicketStatusBadgeComponent,
  ],
  templateUrl: './support-ticket-card.component.html',
  styleUrls: ['./support-ticket-card.component.scss'],
})
export class SupportTicketCardComponent {
  @Input({ required: true }) ticket!: SupportTicket;

  @Output() statusChanged = new EventEmitter<{
    ticketId: number;
    status: SupportTicketStatus;
  }>();

  @Output() remove = new EventEmitter<number>();

  readonly statuses: SupportTicketStatus[] = [
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
  ];

  get statusOptions(): DropdownOption[] {
    return this.statuses.map((status) => ({
      label: status,
      labelKey: this.statusLabelKey(status),
      value: status,
    }));
  }

  constructor(
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService
  ) {}

  changeStatus(status: string): void {
    if (status === this.ticket.status) {
      return;
    }

    this.statusChanged.emit({
      ticketId: this.ticket.id,
      status: status as SupportTicketStatus,
    });
  }

  onRemove(): void {
    this.remove.emit(this.ticket.id);
  }

  priorityLabel(priority: SupportTicketPriority): string {
    return this.t(this.priorityLabelKey(priority));
  }

  private priorityLabelKey(priority: SupportTicketPriority): string {
    const labels: Record<SupportTicketPriority, string> = {
      LOW: 'serviceManagement.priorities.low',
      MEDIUM: 'serviceManagement.priorities.medium',
      HIGH: 'serviceManagement.priorities.high',
      URGENT: 'serviceManagement.priorities.urgent',
    };

    return labels[priority] ?? priority;
  }

  statusLabel(status: SupportTicketStatus): string {
    return this.t(this.statusLabelKey(status));
  }

  private statusLabelKey(status: SupportTicketStatus): string {
    const labels: Record<SupportTicketStatus, string> = {
      OPEN: 'serviceManagement.supportStatuses.open',
      IN_PROGRESS: 'serviceManagement.supportStatuses.inProgress',
      RESOLVED: 'serviceManagement.supportStatuses.resolved',
      CLOSED: 'serviceManagement.supportStatuses.closed',
    };

    return labels[status] ?? status;
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }

  private currentLocale(): string {
    const localeByLanguage: Record<string, string> = {
      es: 'es-PE',
      en: 'en-US',
      pt: 'pt-BR',
    };

    return localeByLanguage[this.uiPreferences.currentLanguage()] ?? localeByLanguage['es'];
  }
}
