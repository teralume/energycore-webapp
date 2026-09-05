import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import {
  MaintenanceTicket,
  MaintenanceTicketStatus,
  MaintenanceTicketType,
} from '../../../domain/model/maintenance-ticket.entity';
import { TicketStatusBadgeComponent } from '../ticket-status-badge/ticket-status-badge.component';

@Component({
  selector: 'app-maintenance-ticket-card',
  standalone: true,
  imports: [
    TranslateModule,
    AppButtonComponent,
    AppDropdownComponent,
    TicketStatusBadgeComponent,
  ],
  templateUrl: './maintenance-ticket-card.component.html',
  styleUrls: ['./maintenance-ticket-card.component.scss'],
})
export class MaintenanceTicketCardComponent {
  @Input({ required: true }) ticket!: MaintenanceTicket;

  @Output() statusChanged = new EventEmitter<{
    ticketId: number;
    status: MaintenanceTicketStatus;
  }>();

  @Output() remove = new EventEmitter<number>();

  readonly statuses: MaintenanceTicketStatus[] = [
    'PENDING',
    'SCHEDULED',
    'COMPLETED',
    'CANCELED',
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
      status: status as MaintenanceTicketStatus,
    });
  }

  onRemove(): void {
    this.remove.emit(this.ticket.id);
  }

  maintenanceTypeLabel(type: MaintenanceTicketType): string {
    return this.t(this.maintenanceTypeLabelKey(type));
  }

  private maintenanceTypeLabelKey(type: MaintenanceTicketType): string {
    const labels: Record<MaintenanceTicketType, string> = {
      INSPECTION: 'serviceManagement.maintenanceTypes.inspection',
      REPAIR: 'serviceManagement.maintenanceTypes.repair',
      REPLACEMENT: 'serviceManagement.maintenanceTypes.replacement',
      INSTALLATION: 'serviceManagement.maintenanceTypes.installation',
    };

    return labels[type] ?? type;
  }

  statusLabel(status: MaintenanceTicketStatus): string {
    return this.t(this.statusLabelKey(status));
  }

  private statusLabelKey(status: MaintenanceTicketStatus): string {
    const labels: Record<MaintenanceTicketStatus, string> = {
      PENDING: 'serviceManagement.maintenanceStatuses.pending',
      SCHEDULED: 'serviceManagement.maintenanceStatuses.scheduled',
      COMPLETED: 'serviceManagement.maintenanceStatuses.completed',
      CANCELED: 'serviceManagement.maintenanceStatuses.canceled',
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
