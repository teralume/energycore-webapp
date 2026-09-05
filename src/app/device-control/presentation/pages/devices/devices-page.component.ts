import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { AppNumberStepperComponent } from '../../../../shared/presentation/components/app-number-stepper/app-number-stepper.component';

import { DeviceControlFacade } from '../../../application/services/device-control.facade';
import { Device, DeviceType } from '../../../domain/model/device.entity';
import { ActiveWorkplaceContextService } from '../../../../workplace/application/services/active-workplace-context.service';
import { WorkplaceFacade } from '../../../../workplace/application/services/workplace.facade';
import { DeviceAssignment } from '../../../../workplace/domain/model/device-assignment.entity';
import { Room } from '../../../../workplace/domain/model/room.entity';

import { DeviceListComponent } from '../../components/device-list/device-list.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { ConfirmDialogOptions, ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { Routine } from '../../../domain/model/routine.entity';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { ModalFormShellComponent } from '../../../../shared/presentation/components/modal-form-shell/modal-form-shell.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import { AccessControlService } from '../../../../shared/application/services/access-control.service';

interface DevicePreset {
  name: string;
  room: string;
  type: DeviceType;
  powerWatts: number;
  icon: string;
}

interface PairingCodeOption {
  code: string;
  labelKey: string;
  type: DeviceType;
}

@Component({
  selector: 'app-devices-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    DeviceListComponent,
    LoadingSpinnerComponent,
    AppDropdownComponent,
    AppNumberStepperComponent,
    AppButtonComponent,
    EmptyStateComponent,
    ModalFormShellComponent,
    SectionCardComponent,
  ],
  templateUrl: './devices-page.component.html',
  styleUrls: ['./devices-page.component.scss'],
})
export class DevicesPageComponent implements OnInit {
  name = '';
  selectedRoomId: number | null = null;
  type: DeviceType = 'PLUG';
  powerWatts = 150;
  isTypeDropdownOpen = false;
  initialLoadComplete = false;
  createModalOpen = false;
  pairModalOpen = false;
  pairingCode = '';
  pairAlias = '';
  renameModalOpen = false;
  renamingDevice: Device | null = null;
  renameDeviceName = '';
  removingDeviceIds = new Set<number>();

  readonly devicePresets: DevicePreset[] = [
    {
      name: 'Lámpara de sala',
      room: 'Sala',
      type: 'LIGHT',
      powerWatts: 12,
      icon: '💡',
    },
    {
      name: 'Smart Plug cocina',
      room: 'Cocina',
      type: 'PLUG',
      powerWatts: 150,
      icon: '🔌',
    },
    {
      name: 'Sensor de movimiento',
      room: 'Entrada',
      type: 'SENSOR',
      powerWatts: 5,
      icon: '📡',
    },
    {
      name: 'Interruptor principal',
      room: 'Sala',
      type: 'SWITCH',
      powerWatts: 60,
      icon: '🔘',
    },
    {
      name: 'Televisor',
      room: 'Sala',
      type: 'PLUG',
      powerWatts: 120,
      icon: '📺',
    },
    {
      name: 'Microondas',
      room: 'Cocina',
      type: 'PLUG',
      powerWatts: 1200,
      icon: '🍳',
    },
    {
      name: 'Refrigeradora',
      room: 'Cocina',
      type: 'PLUG',
      powerWatts: 250,
      icon: '❄️',
    },
    {
      name: 'Aire acondicionado',
      room: 'Dormitorio',
      type: 'PLUG',
      powerWatts: 1800,
      icon: '🌀',
    },
  ];

  async createPresetDevice(preset: DevicePreset): Promise<void> {
    if (!this.canCreateAssignedDevices) {
      return;
    }

    const room = this.resolveRoomForPreset(preset.room);

    if (!room) {
      this.toastService.warning(this.t('devices.validation.roomRequiredBeforePreset'));
      return;
    }

    const device = await this.deviceControlFacade.createDevice({
      name: preset.name,
      room: room.name,
      type: preset.type,
      powerWatts: preset.powerWatts,
    });

    if (device) {
      const assigned = await this.assignCreatedDevice(device, room);

      if (assigned) {
        this.toastService.success(this.t('devices.toasts.presetCreatedAndAssigned', {
          device: preset.name,
          room: room.name,
        }));
        return;
      }

      this.toastService.warning(this.t('devices.toasts.presetCreatedWithoutAssignment', {
        device: preset.name,
      }));
      return;
    }

    this.toastService.error(this.t('devices.toasts.presetCreateError', { device: preset.name }));
  }

  readonly deviceTypeOptions: DropdownOption[] = [
    { value: 'PLUG', label: 'PLUG', labelKey: 'workplace.deviceTypes.plug' },
    { value: 'LIGHT', label: 'LIGHT', labelKey: 'workplace.deviceTypes.light' },
    { value: 'SWITCH', label: 'SWITCH', labelKey: 'workplace.deviceTypes.switch' },
    { value: 'SENSOR', label: 'SENSOR', labelKey: 'workplace.deviceTypes.sensor' },
    { value: 'OTHER', label: 'OTHER', labelKey: 'workplace.deviceTypes.other' },
  ];

  readonly pairingCodeOptions: PairingCodeOption[] = [
    { code: 'EC-PLUG-100', labelKey: 'devices.pair.options.plug', type: 'PLUG' },
    { code: 'EC-LIGHT-200', labelKey: 'devices.pair.options.light', type: 'LIGHT' },
    { code: 'EC-SENSOR-300', labelKey: 'devices.pair.options.sensor', type: 'SENSOR' },
    { code: 'EC-SWITCH-400', labelKey: 'devices.pair.options.switch', type: 'SWITCH' },
  ];

  readonly powerConfigByType: Record<
    DeviceType,
    { min: number; max: number; step: number; defaultValue: number; warningAt: number }
  > = {
    PLUG: { min: 5, max: 2500, step: 5, defaultValue: 150, warningAt: 1800 },
    LIGHT: { min: 3, max: 150, step: 1, defaultValue: 12, warningAt: 100 },
    SWITCH: { min: 5, max: 1800, step: 5, defaultValue: 60, warningAt: 1300 },
    SENSOR: { min: 1, max: 30, step: 1, defaultValue: 5, warningAt: 20 },
    OTHER: { min: 1, max: 1000, step: 5, defaultValue: 80, warningAt: 700 },
  };

  constructor(
    readonly deviceControlFacade: DeviceControlFacade,
    readonly workplaceFacade: WorkplaceFacade,
    private readonly activeWorkplaceContext: ActiveWorkplaceContextService,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly accessControl: AccessControlService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.workplaceFacade.loadWorkplace();
      this.activeWorkplaceContext.ensureActiveLocation(this.workplaceFacade.locations());
      this.ensureSelectedRoom();
    } finally {
      this.initialLoadComplete = true;
    }
  }

  get showInitialLoading(): boolean {
    return this.deviceControlFacade.loading() && !this.initialLoadComplete;
  }

  get activeLocationId(): number | null {
    return this.activeWorkplaceContext.activeLocationId();
  }

  get activeRooms(): Room[] {
    const locationId = this.activeLocationId;
    return locationId
      ? this.workplaceFacade.rooms().filter((room) => room.locationId === locationId)
      : [];
  }

  get selectedRoom(): Room | null {
    return (
      this.activeRooms.find((room) => room.id === this.selectedRoomId) ??
      this.activeRooms[0] ??
      null
    );
  }

  get roomValue(): string | null {
    return this.selectedRoom ? String(this.selectedRoom.id) : null;
  }

  get roomOptions(): DropdownOption[] {
    return this.activeRooms.map((room) => ({
      label: room.name,
      value: String(room.id),
    }));
  }

  get activeLocationName(): string {
    const locationId = this.activeLocationId;
    return locationId
      ? this.workplaceFacade.getLocationName(locationId)
      : this.t('devices.activeSiteFallback');
  }

  get assignedDeviceIds(): Set<number> {
    const locationId = this.activeLocationId;

    if (!locationId) {
      return new Set<number>();
    }

    return new Set(
      [...this.currentAssignmentsByDevice().values()]
        .filter((assignment) => assignment.locationId === locationId)
        .map((assignment) => assignment.deviceId)
    );
  }

  get assignedRoomNamesByDeviceId(): Map<number, string> {
    const locationId = this.activeLocationId;
    const roomNames = new Map<number, string>();

    if (!locationId) {
      return roomNames;
    }

    for (const assignment of this.currentAssignmentsByDevice().values()) {
      if (assignment.locationId !== locationId) {
        continue;
      }

      roomNames.set(
        assignment.deviceId,
        this.workplaceFacade.getRoomName(assignment.roomId)
      );
    }

    return roomNames;
  }

  get assignedDevices(): Device[] {
    const assignedIds = this.assignedDeviceIds;
    return this.deviceControlFacade
      .devices()
      .filter((device) => assignedIds.has(device.id));
  }

  get assignedActiveDevices(): Device[] {
    return this.assignedDevices.filter((device) => device.isOn);
  }

  get assignedCurrentWatts(): number {
    return this.assignedActiveDevices.reduce(
      (total, device) => total + device.powerWatts,
      0
    );
  }

  get currentPowerConfig() {
    return this.powerConfigByType[this.type];
  }

  get canControlDevices(): boolean {
    return this.accessControl.has('CONTROL_DEVICES');
  }

  get canManageDevices(): boolean {
    return this.accessControl.has('MANAGE_DEVICES');
  }

  get canManageSpaces(): boolean {
    return this.accessControl.has('MANAGE_SPACES');
  }

  get canCreateAssignedDevices(): boolean {
    return this.canManageDevices && this.canManageSpaces;
  }

  openCreateModal(): void {
    if (!this.canCreateAssignedDevices) {
      return;
    }

    this.ensureSelectedRoom();
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  openPairModal(): void {
    if (!this.canCreateAssignedDevices) {
      return;
    }

    this.ensureSelectedRoom();
    this.pairModalOpen = true;
  }

  closePairModal(): void {
    this.pairModalOpen = false;
  }

  openRenameModal(device: Device): void {
    if (!this.canManageDevices) {
      return;
    }

    this.renamingDevice = device;
    this.renameDeviceName = device.name;
    this.renameModalOpen = true;
  }

  closeRenameModal(): void {
    this.renameModalOpen = false;
    this.renamingDevice = null;
    this.renameDeviceName = '';
  }

  get isHighPowerSelection(): boolean {
    return this.powerWatts >= this.currentPowerConfig.warningAt;
  }

  get powerAdviceTitle(): string {
    return this.t(this.isHighPowerSelection ? 'devices.powerAdvice.highTitle' : 'devices.powerAdvice.normalTitle');
  }

  get powerAdviceMessage(): string {
    const config = this.currentPowerConfig;
    const typeLabel = this.getDeviceTypeLabel(this.type);

    if (this.isHighPowerSelection) {
      return this.t('devices.powerAdvice.highMessage', {
        type: typeLabel,
        watts: config.warningAt,
      });
    }

    return this.t('devices.powerAdvice.normalMessage', { type: typeLabel });
  }

  getDeviceTypeLabel(type: DeviceType): string {
    const labels: Record<DeviceType, string> = {
      PLUG: 'workplace.deviceTypes.plug',
      LIGHT: 'workplace.deviceTypes.light',
      SWITCH: 'workplace.deviceTypes.switch',
      SENSOR: 'workplace.deviceTypes.sensor',
      OTHER: 'workplace.deviceTypes.other',
    };

    return this.t(labels[type]);
  }

  getDeviceTypeIcon(type: DeviceType): string {
    const icons: Record<DeviceType, string> = {
      PLUG: '🔌',
      LIGHT: '💡',
      SWITCH: '🔘',
      SENSOR: '📡',
      OTHER: '⚡',
    };

    return icons[type] ?? '⚡';
  }

  onTypeChange(): void {
    this.powerWatts = this.currentPowerConfig.defaultValue;
  }

  onPowerBlur(): void {
    const config = this.currentPowerConfig;

    if (!Number.isFinite(this.powerWatts)) {
      this.powerWatts = config.defaultValue;
      return;
    }

    if (this.powerWatts < config.min) {
      this.powerWatts = config.min;
      return;
    }

    if (this.powerWatts > config.max) {
      this.powerWatts = config.max;
    }
  }

  onPowerWattsChange(value: number | null): void {
    this.powerWatts = value ?? this.currentPowerConfig.defaultValue;
    this.onPowerBlur();
  }

  selectPairingCode(code: string): void {
    this.pairingCode = code;
  }

  isSelectedPairingCode(code: string): boolean {
    return this.normalizePairingCode(this.pairingCode) === code;
  }

  async pairDevice(): Promise<void> {
    if (!this.canCreateAssignedDevices) {
      return;
    }

    const pairingCode = this.pairingCode.trim();
    const room = this.selectedRoom;

    if (!pairingCode) {
      this.toastService.warning(this.t('devices.validation.pairingCodeRequired'));
      return;
    }

    if (!room) {
      this.toastService.warning(this.t('devices.validation.roomRequired'));
      return;
    }

    const device = await this.deviceControlFacade.pairDevice({
      pairingCode,
      alias: this.pairAlias,
      room: room.name,
    });

    if (device) {
      const assigned = await this.assignCreatedDevice(device, room);

      if (!assigned) {
        this.toastService.warning(this.t('devices.toasts.pairedWithoutAssignment'));
        return;
      }

      this.pairingCode = '';
      this.pairAlias = '';
      this.closePairModal();

      this.toastService.success(this.t('devices.toasts.pairedAndAssigned', {
        device: device.name,
        room: room.name,
      }));
      return;
    }

    this.toastService.error(this.t('devices.pairError'));
  }

  async createDevice(): Promise<void> {
    if (!this.canCreateAssignedDevices) {
      return;
    }

    const name = this.name.trim();
    const room = this.selectedRoom;

    if (!name) {
      this.toastService.warning(this.t('devices.validation.nameRequired'));
      return;
    }

    if (name.length < 3) {
      this.toastService.warning(this.t('devices.validation.nameMinLength'));
      return;
    }

    if (!room) {
      this.toastService.warning(this.t('devices.validation.roomRequired'));
      return;
    }

    this.onPowerBlur();

    if (!Number.isFinite(this.powerWatts) || this.powerWatts <= 0) {
      this.toastService.warning(this.t('devices.validation.powerRequired'));
      return;
    }

    const device = await this.deviceControlFacade.createDevice({
      name,
      room: room.name,
      type: this.type,
      powerWatts: this.powerWatts,
    });

    if (device) {
      const assigned = await this.assignCreatedDevice(device, room);

      if (!assigned) {
        this.toastService.warning(this.t('devices.toasts.createdWithoutAssignment'));
        return;
      }

      this.name = '';
      this.type = 'PLUG';
      this.powerWatts = this.powerConfigByType.PLUG.defaultValue;
      this.closeCreateModal();

      this.toastService.success(this.t('devices.toasts.createdAndAssigned', { room: room.name }));
      return;
    }

    this.toastService.error(this.t('devices.createError'));
  }

  async toggleDevice(device: Device): Promise<void> {
    if (!this.canControlDevices) {
      return;
    }

    const viewport = this.captureViewport();
    this.stabilizeViewport(viewport);

    const success = await this.deviceControlFacade.toggleDevice(device);
    this.stabilizeViewport(viewport);

    if (success) {
      this.toastService.info(
        device.isOn ? this.t('devices.toasts.turnedOff') : this.t('devices.toasts.turnedOn')
      );
    } else {
      this.toastService.error(this.t('devices.updateError'));
    }
  }

  async renameDevice(): Promise<void> {
    if (!this.canManageDevices) {
      return;
    }

    const device = this.renamingDevice;
    const name = this.renameDeviceName.trim();

    if (!device) {
      return;
    }

    if (!name) {
      this.toastService.warning(this.t('devices.validation.nameRequired'));
      return;
    }

    if (name.length < 3) {
      this.toastService.warning(this.t('devices.validation.nameMinLength'));
      return;
    }

    const success = await this.deviceControlFacade.updateDevice({
      deviceId: device.id,
      name,
      room: device.room,
      type: device.type,
      powerWatts: device.powerWatts,
    });

    if (success) {
      this.closeRenameModal();
      this.toastService.success(this.t('devices.toasts.renamed'));
      return;
    }

    this.toastService.error(this.t('devices.updateError'));
  }

  async deleteDevice(deviceId: number): Promise<void> {
    if (!this.canManageDevices) {
      return;
    }

    if (this.removingDeviceIds.has(deviceId)) {
      return;
    }

    const warnings = this.buildDeviceDeleteWarnings(deviceId);

    if (warnings.length > 0) {
      const confirmed = await this.confirmDialog.confirmSequence(warnings);

      if (!confirmed) {
        return;
      }
    }

    await this.performDeviceDelete(deviceId, this.getDirectDeviceRoutines(deviceId).length);
  }

  private async performDeviceDelete(deviceId: number, removedRoutineCount: number): Promise<void> {
    if (this.removingDeviceIds.has(deviceId)) {
      return;
    }

    const viewport = this.captureViewport();
    this.markDeviceAsRemoving(deviceId, true);
    this.stabilizeViewport(viewport);
    await this.delay(760);

    const success = await this.deviceControlFacade.deleteDevice(deviceId);
    this.stabilizeViewport(viewport);

    if (success) {
      const routineCopy = removedRoutineCount > 0
        ? removedRoutineCount === 1
          ? ` ${this.t('devices.toasts.removedRoutineSingular')}`
          : ` ${this.t('devices.toasts.removedRoutinePlural', { count: removedRoutineCount })}`
        : '';

      this.toastService.info(`${this.t('devices.toasts.deletedHistoryKept')}${routineCopy}`);
    } else {
      this.markDeviceAsRemoving(deviceId, false);
      this.toastService.error(this.t('devices.deleteError'));
    }
  }

  get selectedDeviceTypeLabel(): string {
    return this.getDeviceTypeLabel(this.type);
  }

  selectRoom(value: string): void {
    const roomId = Number(value);
    this.selectedRoomId = Number.isFinite(roomId) ? roomId : null;
  }

  toggleTypeDropdown(): void {
    this.isTypeDropdownOpen = !this.isTypeDropdownOpen;
  }

  selectDeviceType(value: string): void {
    this.type = value as DeviceType;
    this.onTypeChange();
  }

  @HostListener('document:click', ['$event'])
  closeDropdownOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.custom-select')) {
      this.isTypeDropdownOpen = false;
    }
  }

  private ensureSelectedRoom(): void {
    const roomStillActive = this.activeRooms.some((room) => room.id === this.selectedRoomId);

    if (!roomStillActive) {
      this.selectedRoomId = this.activeRooms[0]?.id ?? null;
    }
  }

  private resolveRoomForPreset(roomName: string): Room | null {
    this.ensureSelectedRoom();

    return (
      this.activeRooms.find((room) => this.normalize(room.name) === this.normalize(roomName)) ??
      this.selectedRoom
    );
  }

  private async assignCreatedDevice(device: Device, room: Room): Promise<boolean> {
    const locationId = this.activeLocationId;

    if (!locationId) {
      return false;
    }

    return this.workplaceFacade.assignDevice({
      deviceId: device.id,
      locationId,
      roomId: room.id,
    });
  }

  private normalize(value: string): string {
    return value.trim().toLocaleLowerCase();
  }

  private normalizePairingCode(value: string): string {
    return value.trim().toLocaleUpperCase();
  }

  private currentAssignmentsByDevice(): Map<number, DeviceAssignment> {
    const currentAssignments = new Map<number, DeviceAssignment>();

    for (const assignment of this.workplaceFacade.deviceAssignments()) {
      const current = currentAssignments.get(assignment.deviceId);

      if (!current || this.isNewerAssignment(assignment, current)) {
        currentAssignments.set(assignment.deviceId, assignment);
      }
    }

    return currentAssignments;
  }

  private isNewerAssignment(candidate: DeviceAssignment, current: DeviceAssignment): boolean {
    const candidateTime = this.assignmentTimestamp(candidate);
    const currentTime = this.assignmentTimestamp(current);

    return candidateTime > currentTime ||
      (candidateTime === currentTime && candidate.id > current.id);
  }

  private assignmentTimestamp(assignment: DeviceAssignment): number {
    const assignedAt = Date.parse(assignment.assignedAt);
    return Number.isNaN(assignedAt) ? 0 : assignedAt;
  }

  private getDirectDeviceRoutines(deviceId: number): Routine[] {
    return this.deviceControlFacade
      .routines()
      .filter(
        (routine) =>
          routine.enabled &&
          routine.targetType === 'DEVICE' &&
          (routine.deviceId === deviceId || routine.targetId === deviceId)
      );
  }

  private buildDeviceDeleteWarnings(deviceId: number): ConfirmDialogOptions[] {
    const deviceName =
      this.deviceControlFacade.devices().find((device) => device.id === deviceId)?.name ??
      this.t('devices.deleteFallbackDevice');
    const warnings: ConfirmDialogOptions[] = [];
    const groupNames = this.deviceControlFacade
      .deviceGroups()
      .filter((group) => group.deviceIds.includes(deviceId))
      .map((group) => group.name);
    const directRoutines = this.getDirectDeviceRoutines(deviceId);
    const relatedModes = this.deviceControlFacade
      .operationModes()
      .filter((mode) =>
        mode.status !== 'ARCHIVED' &&
        [
          ...mode.deviceIds,
          ...mode.turnOnDeviceIds,
          ...mode.turnOffDeviceIds,
          ...mode.keepOnDeviceIds,
        ].includes(deviceId)
      );

    if (groupNames.length > 0) {
      warnings.push({
        title: this.t('devices.deleteWarnings.groupsTitle'),
        message: groupNames.length === 1
          ? this.t('devices.deleteWarnings.groupSingular', { device: deviceName, group: groupNames[0] })
          : this.t('devices.deleteWarnings.groupPlural', { device: deviceName, count: groupNames.length }),
        confirmLabel: this.t('common.continue'),
        cancelLabel: this.t('common.keep'),
        tone: 'warning',
      });
    }

    if (directRoutines.length > 0) {
      warnings.push({
        title: this.t('devices.deleteWarnings.routinesTitle'),
        message: this.getDeviceDeleteMessage(deviceId, directRoutines.length),
        confirmLabel: this.t('common.continue'),
        cancelLabel: this.t('common.keep'),
        tone: 'warning',
      });
    }

    if (relatedModes.length > 0) {
      warnings.push({
        title: this.t('devices.deleteWarnings.modesTitle'),
        message: relatedModes.length === 1
          ? this.t('devices.deleteWarnings.modeSingular', { device: deviceName })
          : this.t('devices.deleteWarnings.modePlural', { device: deviceName, count: relatedModes.length }),
        confirmLabel: this.t('common.continue'),
        cancelLabel: this.t('common.keep'),
        tone: 'warning',
      });
    }

    warnings.push({
      title: this.t('devices.deleteWarnings.deleteTitle'),
      message: this.t('devices.deleteWarnings.deleteMessage', { device: deviceName }),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.keep'),
      tone: 'danger',
    });

    return warnings;
  }

  private getDeviceDeleteMessage(deviceId: number, routineCount: number): string {
    const deviceName =
      this.deviceControlFacade.devices().find((device) => device.id === deviceId)?.name ??
      this.t('devices.deleteFallbackDevice');

    return routineCount === 1
      ? this.t('devices.deleteWarnings.routineSingular', { device: deviceName })
      : this.t('devices.deleteWarnings.routinePlural', { device: deviceName, count: routineCount });
  }

  private markDeviceAsRemoving(deviceId: number, removing: boolean): void {
    const next = new Set(this.removingDeviceIds);

    if (removing) {
      next.add(deviceId);
    } else {
      next.delete(deviceId);
    }

    this.removingDeviceIds = next;
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
