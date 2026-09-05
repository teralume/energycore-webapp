import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DeviceControlFacade } from '../../../../device-control/application/services/device-control.facade';
import { ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppDatePickerComponent } from '../../../../shared/presentation/components/app-date-picker/app-date-picker.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { ModalFormShellComponent } from '../../../../shared/presentation/components/modal-form-shell/modal-form-shell.component';

import { ServiceManagementFacade } from '../../../application/services/service-management.facade';
import {
  MaintenanceTicketStatus,
  MaintenanceTicketType,
} from '../../../domain/model/maintenance-ticket.entity';
import { MaintenanceTicketCardComponent } from '../../components/maintenance-ticket-card/maintenance-ticket-card.component';

@Component({
  selector: 'app-maintenance-tickets-page',
  standalone: true,
  imports: [
    TranslateModule,
    FormsModule,
    AppButtonComponent,
    AppDatePickerComponent,
    AppDropdownComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    MaintenanceTicketCardComponent,
    ModalFormShellComponent,
  ],
  templateUrl: './maintenance-tickets-page.component.html',
  styleUrls: ['./maintenance-tickets-page.component.scss'],
})
export class MaintenanceTicketsPageComponent implements OnInit {
  deviceId: number | null = null;
  type: MaintenanceTicketType = 'INSPECTION';
  description = '';
  scheduledDate = '';
  isMaintenanceModalOpen = false;

  readonly types: MaintenanceTicketType[] = [
    'INSPECTION',
    'REPAIR',
    'REPLACEMENT',
    'INSTALLATION',
  ];

  get deviceValue(): string | null {
    return this.deviceId ? String(this.deviceId) : null;
  }

  get deviceOptions(): DropdownOption[] {
    return this.deviceControlFacade.devices().map((device) => ({
      label: device.name,
      value: String(device.id),
      description: device.room
        ? `${device.room} - ${device.powerWatts} W`
        : `${device.powerWatts} W`,
    }));
  }

  get hasDevices(): boolean {
    return this.deviceControlFacade.devices().length > 0;
  }

  get todayInput(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${today.getFullYear()}-${month}-${day}`;
  }

  get typeOptions(): DropdownOption[] {
    return this.types.map((type) => ({
      label: type,
      labelKey: this.maintenanceTypeLabelKey(type),
      value: type,
    }));
  }

  constructor(
    readonly serviceManagementFacade: ServiceManagementFacade,
    readonly deviceControlFacade: DeviceControlFacade,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.serviceManagementFacade.loadServiceManagement();

    if (this.serviceManagementFacade.error()) {
      this.toastService.error(this.t('serviceManagement.maintenanceLoadError'));
    }
  }

  openMaintenanceModal(): void {
    if (!this.hasDevices) {
      this.toastService.info(this.t('serviceManagement.validation.deviceRequiredBeforeMaintenance'));
      return;
    }

    this.isMaintenanceModalOpen = true;
  }

  closeMaintenanceModal(): void {
    this.isMaintenanceModalOpen = false;
  }

  async createTicket(): Promise<void> {
    if (!this.deviceId) {
      this.toastService.warning(this.t('serviceManagement.validation.maintenanceDeviceRequired'));
      return;
    }

    const description = this.description.trim();

    if (!description) {
      this.toastService.warning(this.t('serviceManagement.validation.maintenanceDescriptionRequired'));
      return;
    }

    if (description.length < 10) {
      this.toastService.warning(this.t('serviceManagement.validation.descriptionMinLength'));
      return;
    }

    if (!this.scheduledDate) {
      this.toastService.warning(this.t('serviceManagement.validation.maintenanceDateRequired'));
      return;
    }

    if (this.isPastDate(this.scheduledDate)) {
      this.toastService.warning(this.t('serviceManagement.validation.maintenanceDatePast'));
      return;
    }

    const deviceName = this.deviceControlFacade.getDeviceName(Number(this.deviceId));

    if (!deviceName || deviceName === 'Unknown device') {
      this.toastService.error(this.t('serviceManagement.validation.maintenanceDeviceUnknown'));
      return;
    }

    const success = await this.serviceManagementFacade.createMaintenanceTicket({
      deviceId: Number(this.deviceId),
      deviceName,
      type: this.type,
      description,
      scheduledDate: this.scheduledDate,
    });

    if (success) {
      this.deviceId = null;
      this.type = 'INSPECTION';
      this.description = '';
      this.scheduledDate = '';
      this.closeMaintenanceModal();
      this.toastService.success(this.t('serviceManagement.maintenanceCreateSuccess'));
      return;
    }

    this.toastService.error(this.t('serviceManagement.maintenanceCreateError'));
  }

  selectDevice(value: string): void {
    const deviceId = Number(value);
    this.deviceId = Number.isFinite(deviceId) ? deviceId : null;
  }

  selectType(value: string): void {
    this.type = value as MaintenanceTicketType;
  }

  selectDate(value: string): void {
    this.scheduledDate = value;
  }

  maintenanceTypeLabel(type: MaintenanceTicketType): string {
    return this.t(this.maintenanceTypeLabelKey(type));
  }

  maintenanceTypeLabelKey(type: MaintenanceTicketType): string {
    const labels: Record<MaintenanceTicketType, string> = {
      INSPECTION: 'serviceManagement.maintenanceTypes.inspection',
      REPAIR: 'serviceManagement.maintenanceTypes.repair',
      REPLACEMENT: 'serviceManagement.maintenanceTypes.replacement',
      INSTALLATION: 'serviceManagement.maintenanceTypes.installation',
    };

    return labels[type] ?? type;
  }

  async updateStatus(statusChange: {
    ticketId: number;
    status: MaintenanceTicketStatus;
  }): Promise<void> {
    if (statusChange.status === 'CANCELED') {
      const confirmed = await this.confirmDialog.confirm({
        title: this.t('serviceManagement.confirmCancelMaintenanceTitle'),
        message: this.t('serviceManagement.confirmCancelMaintenanceMessage'),
        confirmLabel: this.t('serviceManagement.cancelMaintenance'),
        cancelLabel: this.t('serviceManagement.back'),
        tone: 'warning',
      });

      if (!confirmed) {
        return;
      }
    }

    const success =
      await this.serviceManagementFacade.updateMaintenanceTicketStatus(statusChange);

    if (success) {
      this.toastService.info(this.t('serviceManagement.maintenanceUpdateSuccess'));
      return;
    }

    this.toastService.error(this.t('serviceManagement.maintenanceUpdateError'));
  }

  async deleteTicket(ticketId: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('serviceManagement.confirmDeleteMaintenanceTitle'),
      message: this.t('serviceManagement.confirmDeleteMaintenanceMessage'),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.keep'),
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

    const success =
      await this.serviceManagementFacade.deleteMaintenanceTicket(ticketId);

    if (success) {
      this.toastService.info(this.t('serviceManagement.maintenanceDeleteSuccess'));
      return;
    }

    this.toastService.error(this.t('serviceManagement.maintenanceDeleteError'));
  }

  private isPastDate(value: string): boolean {
    const selectedDate = new Date(`${value}T00:00:00`);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return selectedDate.getTime() < today.getTime();
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }
}
