import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { ModalFormShellComponent } from '../../../../shared/presentation/components/modal-form-shell/modal-form-shell.component';

import { ServiceManagementFacade } from '../../../application/services/service-management.facade';
import {
  SupportTicketPriority,
  SupportTicketStatus,
} from '../../../domain/model/support-ticket.entity';
import { SupportTicketCardComponent } from '../../components/support-ticket-card/support-ticket-card.component';

@Component({
  selector: 'app-support-tickets-page',
  standalone: true,
  imports: [
    TranslateModule,
    FormsModule,
    AppButtonComponent,
    AppDropdownComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    ModalFormShellComponent,
    SupportTicketCardComponent,
  ],
  templateUrl: './support-tickets-page.component.html',
  styleUrls: ['./support-tickets-page.component.scss'],
})
export class SupportTicketsPageComponent implements OnInit {
  subject = '';
  description = '';
  priority: SupportTicketPriority = 'MEDIUM';
  isSupportModalOpen = false;

  readonly priorities: SupportTicketPriority[] = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT',
  ];

  get priorityOptions(): DropdownOption[] {
    return this.priorities.map((priority) => ({
      label: priority,
      labelKey: this.priorityLabelKey(priority),
      value: priority,
    }));
  }

  constructor(
    readonly serviceManagementFacade: ServiceManagementFacade,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.serviceManagementFacade.loadServiceManagement();

    if (this.serviceManagementFacade.error()) {
      this.toastService.error(this.t('serviceManagement.supportLoadError'));
    }
  }

  openSupportModal(): void {
    this.isSupportModalOpen = true;
  }

  closeSupportModal(): void {
    this.isSupportModalOpen = false;
  }

  async createTicket(): Promise<void> {
    const subject = this.subject.trim();
    const description = this.description.trim();

    if (!subject) {
      this.toastService.warning(this.t('serviceManagement.validation.supportSubjectRequired'));
      return;
    }

    if (subject.length < 4) {
      this.toastService.warning(this.t('serviceManagement.validation.supportSubjectMinLength'));
      return;
    }

    if (!description) {
      this.toastService.warning(this.t('serviceManagement.validation.supportDescriptionRequired'));
      return;
    }

    if (description.length < 10) {
      this.toastService.warning(this.t('serviceManagement.validation.descriptionMinLength'));
      return;
    }

    const success = await this.serviceManagementFacade.createSupportTicket({
      subject,
      description,
      priority: this.priority,
    });

    if (success) {
      this.subject = '';
      this.description = '';
      this.priority = 'MEDIUM';
      this.closeSupportModal();
      this.toastService.success(this.t('serviceManagement.supportCreateSuccess'));
      return;
    }

    this.toastService.error(this.t('serviceManagement.supportCreateError'));
  }

  selectPriority(value: string): void {
    this.priority = value as SupportTicketPriority;
  }

  priorityLabel(priority: SupportTicketPriority): string {
    return this.t(this.priorityLabelKey(priority));
  }

  priorityLabelKey(priority: SupportTicketPriority): string {
    const labels: Record<SupportTicketPriority, string> = {
      LOW: 'serviceManagement.priorities.low',
      MEDIUM: 'serviceManagement.priorities.medium',
      HIGH: 'serviceManagement.priorities.high',
      URGENT: 'serviceManagement.priorities.urgent',
    };

    return labels[priority] ?? priority;
  }

  async updateStatus(statusChange: {
    ticketId: number;
    status: SupportTicketStatus;
  }): Promise<void> {
    const success = await this.serviceManagementFacade.updateSupportTicketStatus(statusChange);

    if (success) {
      this.toastService.info(this.t('serviceManagement.supportUpdateSuccess'));
      return;
    }

    this.toastService.error(this.t('serviceManagement.supportUpdateError'));
  }

  async deleteTicket(ticketId: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('serviceManagement.confirmDeleteSupportTitle'),
      message: this.t('serviceManagement.confirmDeleteSupportMessage'),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.keep'),
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

    const success = await this.serviceManagementFacade.deleteSupportTicket(ticketId);

    if (success) {
      this.toastService.info(this.t('serviceManagement.supportDeleteSuccess'));
      return;
    }

    this.toastService.error(this.t('serviceManagement.supportDeleteError'));
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }
}
