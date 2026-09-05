import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DeviceControlFacade } from '../../../application/services/device-control.facade';
import { Device, DeviceStatus } from '../../../domain/model/device.entity';
import { DeviceGroup } from '../../../domain/model/device-group.entity';
import { ActiveWorkplaceContextService } from '../../../../workplace/application/services/active-workplace-context.service';
import { WorkplaceFacade } from '../../../../workplace/application/services/workplace.facade';

import { DeviceGroupCardComponent } from '../../components/device-group-card/device-group-card.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { ConfirmDialogOptions, ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { ModalFormShellComponent } from '../../../../shared/presentation/components/modal-form-shell/modal-form-shell.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';

interface DeviceSelectionRoomSection {
  roomName: string;
  devices: Device[];
  selectedCount: number;
  availableCount: number;
}

interface DeviceGroupView {
  group: DeviceGroup;
  roomName: string;
  devices: Device[];
}

interface DeviceGroupRoomSection {
  roomName: string;
  groups: DeviceGroupView[];
  groupCount: number;
  deviceCount: number;
  activeDeviceCount: number;
  currentWatts: number;
}

@Component({
  selector: 'app-device-groups-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    DeviceGroupCardComponent,
    LoadingSpinnerComponent,
    AppButtonComponent,
    EmptyStateComponent,
    ModalFormShellComponent,
    SectionCardComponent,
  ],
  templateUrl: './device-groups-page.component.html',
  styleUrls: ['./device-groups-page.component.scss'],
})
export class DeviceGroupsPageComponent implements OnInit {
  name = '';
  description = '';
  selectedDeviceIds: number[] = [];
  initialLoadComplete = false;
  createModalOpen = false;
  removingGroupIds = new Set<number>();

  constructor(
    readonly deviceControlFacade: DeviceControlFacade,
    readonly workplaceFacade: WorkplaceFacade,
    private readonly activeWorkplaceContext: ActiveWorkplaceContextService,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([
        this.deviceControlFacade.loadDeviceControl(),
        this.workplaceFacade.loadWorkplace(),
      ]);

      this.activeWorkplaceContext.ensureActiveLocation(this.workplaceFacade.locations());
    } finally {
      this.initialLoadComplete = true;
    }
  }

  get showInitialLoading(): boolean {
    return this.deviceControlFacade.loading() && !this.initialLoadComplete;
  }

  get selectedCount(): number {
    return this.selectedDeviceIds.length;
  }

  get groupNameIsValid(): boolean {
    return Boolean(this.name.trim());
  }

  get groupSubmitDisabled(): boolean {
    return (
      this.deviceControlFacade.loading() ||
      !this.activeLocationId ||
      !this.groupNameIsValid ||
      this.selectedCount === 0
    );
  }

  get assignedDeviceCount(): number {
    return this.sortedDevices.length;
  }

  get selectedRoomName(): string {
    const firstDeviceId = this.selectedDeviceIds[0];

    if (!firstDeviceId) {
      return this.t('deviceGroups.noSelection');
    }

    const device = this.deviceControlFacade.devices().find((item) => item.id === firstDeviceId);
    return device ? this.displayRoomName(this.getDeviceRoomName(device)) : this.t('deviceGroups.noSelection');
  }

  get activeLocationId(): number | null {
    return this.activeWorkplaceContext.activeLocationId();
  }

  get activeLocationName(): string {
    const locationId = this.activeLocationId;
    return locationId
      ? this.workplaceFacade.getLocationName(locationId)
      : this.t('devices.activeSiteFallback');
  }

  get activeDeviceIds(): Set<number> {
    const locationId = this.activeLocationId;
    if (!locationId) {
      return new Set<number>();
    }

    return new Set(
      this.workplaceFacade
        .deviceAssignments()
        .filter((assignment) => assignment.locationId === locationId)
        .map((assignment) => assignment.deviceId)
    );
  }

  get activeGroups(): DeviceGroup[] {
    const activeDeviceIds = this.activeDeviceIds;
    return this.deviceControlFacade
      .deviceGroups()
      .filter((group) => group.deviceIds.some((deviceId) => activeDeviceIds.has(deviceId)));
  }

  get sortedDevices(): Device[] {
    const activeDeviceIds = this.activeDeviceIds;
    return [...this.deviceControlFacade.devices()]
      .filter((device) => activeDeviceIds.has(device.id))
      .sort((first, second) => this.getDeviceRoomName(first).localeCompare(this.getDeviceRoomName(second)) || first.name.localeCompare(second.name));
  }

  get selectableDeviceRoomSections(): DeviceSelectionRoomSection[] {
    const sections = new Map<string, Device[]>();

    for (const device of this.sortedDevices) {
      const roomName = this.getDeviceRoomName(device);
      const devices = sections.get(roomName) ?? [];
      devices.push(device);
      sections.set(roomName, devices);
    }

    return [...sections.entries()]
      .map(([roomName, devices]) => ({
        roomName,
        devices,
        selectedCount: devices.filter((device) => this.isDeviceSelected(device.id)).length,
        availableCount: devices.length,
      }))
      .sort((left, right) => left.roomName.localeCompare(right.roomName));
  }

  get groupRoomSections(): DeviceGroupRoomSection[] {
    const sections = new Map<string, DeviceGroupView[]>();

    for (const group of this.activeGroups) {
      const devices = this.getGroupDevices(group);
      const roomName = devices[0] ? this.getDeviceRoomName(devices[0]) : '';
      const groups = sections.get(roomName) ?? [];
      groups.push({ group, roomName, devices });
      sections.set(roomName, groups);
    }

    return [...sections.entries()]
      .map(([roomName, groups]) => {
        const devices = groups.flatMap((item) => item.devices);

        return {
          roomName,
          groups,
          groupCount: groups.length,
          deviceCount: devices.length,
          activeDeviceCount: devices.filter((device) => device.isOn).length,
          currentWatts: devices.reduce(
            (total, device) => total + (device.isOn ? device.powerWatts : 0),
            0
          ),
        };
      })
      .sort((left, right) => left.roomName.localeCompare(right.roomName));
  }

  isDeviceSelected(deviceId: number): boolean {
    return this.selectedDeviceIds.includes(deviceId);
  }

  toggleDeviceSelection(deviceId: number, checked: boolean): void {
    if (checked) {
      const device = this.deviceControlFacade.devices().find((item) => item.id === deviceId);
      const firstDevice = this.deviceControlFacade.devices().find((item) => item.id === this.selectedDeviceIds[0]);

      if (device && firstDevice && this.getDeviceRoomName(device) !== this.getDeviceRoomName(firstDevice)) {
        this.toastService.warning(this.t('deviceGroups.validation.sameRoom'));
        return;
      }

      this.selectedDeviceIds = Array.from(
        new Set([...this.selectedDeviceIds, deviceId])
      );
      return;
    }

    this.selectedDeviceIds = this.selectedDeviceIds.filter((id) => id !== deviceId);
  }

  openCreateModal(): void {
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  async createGroup(): Promise<void> {
    if (!this.activeLocationId) {
      this.toastService.warning(this.t('deviceGroups.validation.activeLocationRequired'));
      return;
    }

    if (!this.groupNameIsValid) {
      this.toastService.warning(this.t('deviceGroups.validation.nameRequired'));
      return;
    }

    if (this.selectedCount === 0) {
      this.toastService.warning(this.t('deviceGroups.validation.deviceRequired'));
      return;
    }

    const success = await this.deviceControlFacade.createDeviceGroup({
      name: this.name,
      description: this.description,
      deviceIds: this.selectedDeviceIds,
    });

    if (success) {
      this.name = '';
      this.description = '';
      this.selectedDeviceIds = [];
      this.closeCreateModal();
      this.toastService.success(this.t('deviceGroups.createSuccess'));
      return;
    }

    this.toastService.error(this.t('deviceGroups.createError'));
  }

  async executeGroupAction(command: {
    groupId: number;
    status: DeviceStatus;
  }): Promise<void> {
    const viewport = this.captureViewport();
    this.stabilizeViewport(viewport);

    const success = await this.deviceControlFacade.executeGroupAction(command);
    this.stabilizeViewport(viewport);

    if (success) {
      this.toastService.info(this.t('deviceGroups.executeSuccess'));
      return;
    }

    this.toastService.error(this.t('deviceGroups.executeError'));
  }

  async deleteGroup(groupId: number): Promise<void> {
    if (this.removingGroupIds.has(groupId)) {
      return;
    }

    const confirmed = await this.confirmDialog.confirmSequence(
      this.buildGroupDeleteWarnings(groupId)
    );

    if (!confirmed) {
      return;
    }

    const viewport = this.captureViewport();
    this.markGroupAsRemoving(groupId, true);
    this.stabilizeViewport(viewport);
    await this.delay(760);

    const success = await this.deviceControlFacade.deleteDeviceGroup(groupId);
    this.stabilizeViewport(viewport);

    if (success) {
      this.toastService.info(this.t('deviceGroups.deleteSuccess'));
      return;
    }

    this.markGroupAsRemoving(groupId, false);
    this.toastService.error(this.t('deviceGroups.deleteError'));
  }

  getDeviceIcon(type: string): string {
    switch (type) {
      case 'LIGHT':
        return '💡';
      case 'SENSOR':
        return '📡';
      case 'SWITCH':
        return '🔘';
      case 'PLUG':
        return '🔌';
      default:
        return '⚡';
    }
  }

  getGroupNamesByDeviceId(deviceId: number): string[] {
    return this.deviceControlFacade
      .deviceGroups()
      .filter((item) => item.deviceIds.includes(deviceId))
      .map((item) => item.name);
  }

  getGroupMembershipLabel(deviceId: number): string {
    return this.getGroupNamesByDeviceId(deviceId).join(', ');
  }

  getDeviceSelectionLabel(deviceId: number): string {
    if (this.isDeviceSelected(deviceId)) {
      return this.t('deviceGroups.selection.selected');
    }

    return this.t('deviceGroups.selection.select');
  }

  isGroupRemoving(groupId: number): boolean {
    return this.removingGroupIds.has(groupId);
  }

  private buildGroupDeleteWarnings(groupId: number): ConfirmDialogOptions[] {
    const group = this.deviceControlFacade.deviceGroups().find((item) => item.id === groupId);
    const groupName = group?.name ?? this.t('deviceGroups.deleteFallbackGroup');
    const warnings: ConfirmDialogOptions[] = [];
    const activeRoutines = this.deviceControlFacade
      .routines()
      .filter((routine) =>
        routine.enabled &&
        routine.targetType === 'GROUP' &&
        (routine.groupId === groupId || routine.targetId === groupId)
      );
    const relatedModes = this.deviceControlFacade
      .operationModes()
      .filter((mode) => mode.status !== 'ARCHIVED' && mode.groupIds.includes(groupId));

    if (group?.deviceIds.length) {
      warnings.push({
        title: this.t('deviceGroups.deleteWarnings.devicesTitle'),
        message: this.t('deviceGroups.deleteWarnings.devicesMessage', {
          group: groupName,
          count: group.deviceIds.length,
        }),
        confirmLabel: this.t('common.continue'),
        cancelLabel: this.t('common.keep'),
        tone: 'warning',
      });
    }

    if (activeRoutines.length > 0) {
      warnings.push({
        title: this.t('deviceGroups.deleteWarnings.routinesTitle'),
        message: activeRoutines.length === 1
          ? this.t('deviceGroups.deleteWarnings.routineSingular', { group: groupName })
          : this.t('deviceGroups.deleteWarnings.routinePlural', { group: groupName, count: activeRoutines.length }),
        confirmLabel: this.t('common.continue'),
        cancelLabel: this.t('common.keep'),
        tone: 'warning',
      });
    }

    if (relatedModes.length > 0) {
      warnings.push({
        title: this.t('deviceGroups.deleteWarnings.modesTitle'),
        message: relatedModes.length === 1
          ? this.t('deviceGroups.deleteWarnings.modeSingular', { group: groupName })
          : this.t('deviceGroups.deleteWarnings.modePlural', { group: groupName, count: relatedModes.length }),
        confirmLabel: this.t('common.continue'),
        cancelLabel: this.t('common.keep'),
        tone: 'warning',
      });
    }

    warnings.push({
      title: this.t('deviceGroups.deleteWarnings.deleteTitle'),
      message: this.t('deviceGroups.deleteWarnings.deleteMessage', { group: groupName }),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.keep'),
      tone: 'danger',
    });

    return warnings;
  }

  private getGroupDevices(group: DeviceGroup): Device[] {
    const activeDeviceIds = this.activeDeviceIds;
    const devicesById = new Map(
      this.deviceControlFacade.devices().map((device) => [device.id, device])
    );

    return group.deviceIds
      .filter((deviceId) => activeDeviceIds.has(deviceId))
      .map((deviceId) => devicesById.get(deviceId))
      .filter((device): device is Device => Boolean(device));
  }

  private getDeviceRoomName(device: Device): string {
    const locationId = this.activeLocationId;
    const assignment = this.workplaceFacade
      .deviceAssignments()
      .find(
        (item) =>
          item.deviceId === device.id &&
          (!locationId || item.locationId === locationId)
      );

    if (assignment?.roomId) {
      const room = this.workplaceFacade
        .rooms()
        .find((item) => item.id === assignment.roomId);

      if (room?.name) {
        return room.name;
      }
    }

    return device.room?.trim() || '';
  }

  displayRoomName(roomName: string): string {
    return roomName || this.t('devices.noRoom');
  }

  private markGroupAsRemoving(groupId: number, removing: boolean): void {
    const next = new Set(this.removingGroupIds);

    if (removing) {
      next.add(groupId);
    } else {
      next.delete(groupId);
    }

    this.removingGroupIds = next;
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  private captureViewport(): { x: number; y: number } | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return {
      x: window.scrollX,
      y: window.scrollY,
    };
  }

  private stabilizeViewport(viewport: { x: number; y: number } | null): void {
    if (!viewport || typeof window === 'undefined') {
      return;
    }

    const restore = () => {
      if (
        Math.abs(window.scrollX - viewport.x) > 1 ||
        Math.abs(window.scrollY - viewport.y) > 1
      ) {
        window.scrollTo(viewport.x, viewport.y);
      }
    };

    requestAnimationFrame(restore);
    window.setTimeout(restore, 48);
    window.setTimeout(restore, 140);
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
