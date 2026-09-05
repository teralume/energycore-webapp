import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DeviceControlFacade } from '../../../../device-control/application/services/device-control.facade';
import { Routine } from '../../../../device-control/domain/model/routine.entity';
import { ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { ModalFormShellComponent } from '../../../../shared/presentation/components/modal-form-shell/modal-form-shell.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import { ActiveWorkplaceContextService } from '../../../application/services/active-workplace-context.service';
import { WorkplaceFacade } from '../../../application/services/workplace.facade';
import { Room } from '../../../domain/model/room.entity';
import { RoomCardComponent } from '../../components/room-card/room-card.component';

@Component({
  selector: 'app-rooms-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    AppButtonComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    ModalFormShellComponent,
    RoomCardComponent,
    SectionCardComponent,
  ],
  templateUrl: './rooms-page.component.html',
  styleUrls: ['./rooms-page.component.scss'],
})
export class RoomsPageComponent implements OnInit {
  name = '';
  createModalOpen = false;
  private readonly defaultRoomFloor = 'General';

  constructor(
    readonly workplaceFacade: WorkplaceFacade,
    readonly deviceControlFacade: DeviceControlFacade,
    private readonly activeWorkplaceContext: ActiveWorkplaceContextService,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.workplaceFacade.loadWorkplace();
    this.activeWorkplaceContext.ensureActiveLocation(this.workplaceFacade.locations());

    if (this.workplaceFacade.error()) {
      this.toastService.error(this.t('workplace.rooms.toasts.loadError'));
    }
  }

  get activeLocationId(): number | null {
    return this.activeWorkplaceContext.activeLocationId();
  }

  get activeRooms() {
    const locationId = this.activeLocationId;
    return locationId
      ? this.workplaceFacade.rooms().filter((room) => room.locationId === locationId)
      : [];
  }

  get activeAssignments() {
    const locationId = this.activeLocationId;
    return locationId ? this.workplaceFacade.getCurrentDeviceAssignmentsForLocation(locationId) : [];
  }

  get activeDeviceCount(): number {
    return new Set(this.activeAssignments.map((assignment) => assignment.deviceId)).size;
  }

  get activeGroupCount(): number {
    const activeDeviceIds = new Set(this.activeAssignments.map((assignment) => assignment.deviceId));

    return this.deviceControlFacade
      .deviceGroups()
      .filter((group) => group.deviceIds.some((deviceId) => activeDeviceIds.has(deviceId)))
      .length;
  }

  get activeLocationName(): string {
    const locationId = this.activeLocationId;
    return locationId
      ? this.workplaceFacade.getLocationName(locationId)
      : this.t('workplace.rooms.activeLocationFallback');
  }

  openCreateModal(): void {
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  async createRoom(): Promise<void> {
    const locationId = this.activeLocationId;

    if (!locationId) {
      this.toastService.warning(this.t('workplace.rooms.toasts.locationRequired'));
      return;
    }

    const success = await this.workplaceFacade.createRoom({
      locationId,
      name: this.name,
      floor: this.defaultRoomFloor,
    });

    if (success) {
      this.name = '';
      this.closeCreateModal();
      this.toastService.success(this.t('workplace.roomCreateSuccess'));
      return;
    }

    this.toastService.error(this.t('workplace.roomCreateError'));
  }

  async deleteRoom(roomId: number): Promise<void> {
    const room = this.activeRooms.find((item) => item.id === roomId);
    const deviceCount = room ? this.getRoomDeviceCount(room) : 0;
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('workplace.rooms.deleteTitle'),
      message: deviceCount > 0
        ? this.t('workplace.rooms.deleteMessageWithDevices', { count: deviceCount })
        : this.t('workplace.rooms.deleteMessageEmpty'),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.cancel'),
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

    const success = await this.workplaceFacade.deleteRoom(roomId);

    if (success) {
      this.toastService.info(this.t('workplace.rooms.toasts.deleteSuccess'));
      return;
    }

    this.toastService.error(this.t('workplace.roomDeleteError'));
  }

  getRoomDeviceCount(room: Room): number {
    return this.getRoomDeviceIds(room).size;
  }

  getRoomActiveDeviceCount(room: Room): number {
    const deviceIds = this.getRoomDeviceIds(room);
    return this.deviceControlFacade
      .devices()
      .filter((device) => deviceIds.has(device.id) && device.isOn)
      .length;
  }

  getRoomCurrentWatts(room: Room): number {
    const deviceIds = this.getRoomDeviceIds(room);
    return this.deviceControlFacade
      .devices()
      .filter((device) => deviceIds.has(device.id) && device.isOn)
      .reduce((total, device) => total + device.powerWatts, 0);
  }

  getRoomGroupCount(room: Room): number {
    const deviceIds = this.getRoomDeviceIds(room);
    return this.deviceControlFacade
      .deviceGroups()
      .filter((group) => group.deviceIds.some((deviceId) => deviceIds.has(deviceId)))
      .length;
  }

  getRoomRoutineCount(room: Room): number {
    return this.getRoomRoutines(room).length;
  }

  getRoomPrimaryGroupName(room: Room): string {
    const deviceIds = this.getRoomDeviceIds(room);
    return (
      this.deviceControlFacade
        .deviceGroups()
        .find((group) => group.deviceIds.some((deviceId) => deviceIds.has(deviceId)))
        ?.name ?? ''
    );
  }

  private getRoomDeviceIds(room: Room): Set<number> {
    return new Set(
      this.activeAssignments
        .filter((assignment) => assignment.roomId === room.id)
        .map((assignment) => assignment.deviceId)
    );
  }

  private getRoomGroupIds(room: Room): Set<number> {
    const deviceIds = this.getRoomDeviceIds(room);

    return new Set(
      this.deviceControlFacade
        .deviceGroups()
        .filter((group) => group.deviceIds.some((deviceId) => deviceIds.has(deviceId)))
        .map((group) => group.id)
    );
  }

  private getRoomRoutines(room: Room): Routine[] {
    const deviceIds = this.getRoomDeviceIds(room);
    const groupIds = this.getRoomGroupIds(room);
    const locationId = this.activeLocationId;

    return this.deviceControlFacade.routines().filter((routine) => {
      if (routine.targetType === 'ROOM') {
        return routine.targetId === room.id;
      }

      if (routine.targetType === 'DEVICE') {
        return Boolean(routine.deviceId && deviceIds.has(routine.deviceId)) || deviceIds.has(routine.targetId);
      }

      if (routine.targetType === 'GROUP') {
        return Boolean(routine.groupId && groupIds.has(routine.groupId)) || groupIds.has(routine.targetId);
      }

      return Boolean(locationId && routine.targetId === locationId);
    });
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
