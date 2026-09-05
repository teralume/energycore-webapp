import { Component, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DeviceControlFacade } from '../../../../device-control/application/services/device-control.facade';
import { Device } from '../../../../device-control/domain/model/device.entity';
import { Routine } from '../../../../device-control/domain/model/routine.entity';
import { ConfirmDialogOptions, ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import { ActiveWorkplaceContextService } from '../../../application/services/active-workplace-context.service';
import { WorkplaceFacade } from '../../../application/services/workplace.facade';
import { DeviceAssignment } from '../../../domain/model/device-assignment.entity';
import { Room } from '../../../domain/model/room.entity';

interface RoomPanel {
  labelKey: string;
  room: Room | null;
  assignments: DeviceAssignment[];
}

@Component({
  selector: 'app-device-assignments-page',
  standalone: true,
  imports: [
    TranslateModule,
    AppDropdownComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    SectionCardComponent,
  ],
  templateUrl: './device-assignments-page.component.html',
  styleUrls: ['./device-assignments-page.component.scss'],
})
export class DeviceAssignmentsPageComponent implements OnInit {
  roomOneValue: string | null = null;
  roomTwoValue: string | null = null;
  draggedAssignmentId: number | null = null;
  activeDropRoomId: number | null = null;

  constructor(
    readonly workplaceFacade: WorkplaceFacade,
    readonly deviceControlFacade: DeviceControlFacade,
    private readonly activeWorkplaceContext: ActiveWorkplaceContextService,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.workplaceFacade.loadWorkplace(),
      this.deviceControlFacade.loadDeviceControl(),
    ]);

    this.activeWorkplaceContext.ensureActiveLocation(this.workplaceFacade.locations());
    this.initializeRoomSelection();

    if (this.workplaceFacade.error()) {
      this.toastService.error(this.t('workplace.assignments.toasts.loadError'));
    }
  }

  get activeLocationId(): number | null {
    return this.activeWorkplaceContext.activeLocationId();
  }

  get activeLocationName(): string {
    const locationId = this.activeLocationId;
    return locationId
      ? this.workplaceFacade.getLocationName(locationId)
      : this.t('workplace.assignments.activeLocationFallback');
  }

  get activeRooms() {
    const locationId = this.activeLocationId;
    return locationId
      ? this.workplaceFacade.rooms().filter((room) => room.locationId === locationId)
      : [];
  }

  get activeAssignments() {
    const locationId = this.activeLocationId;

    if (!locationId) {
      return [];
    }

    const visibleDeviceIds = new Set(
      this.deviceControlFacade
        .devices()
        .filter((device) => !device.isRemoved)
        .map((device) => device.id)
    );

    return [...this.currentAssignmentsByDevice().values()]
      .filter((assignment) =>
        assignment.locationId === locationId && visibleDeviceIds.has(assignment.deviceId)
      )
      .sort((first, second) =>
        this.assignmentTimestamp(second) - this.assignmentTimestamp(first) ||
        second.id - first.id
      );
  }

  get roomOneDropdownOptions(): DropdownOption[] {
    return this.roomSelectionOptions(this.roomTwoValue);
  }

  get roomTwoDropdownOptions(): DropdownOption[] {
    const options = this.roomSelectionOptions(this.roomOneValue);

    if (options.length === 0) {
      return [
        {
          label: 'no-second-room',
          labelKey: 'workplace.assignments.noSecondRoomOption',
          value: '__NO_SECOND_ROOM__',
          emptyState: true,
          disabled: true,
        },
      ];
    }

    return options;
  }

  get roomOne(): Room | null {
    return this.roomFromValue(this.roomOneValue);
  }

  get roomTwo(): Room | null {
    return this.roomFromValue(this.roomTwoValue);
  }

  selectRoomOne(value: string): void {
    if (!this.roomFromValue(value)) {
      return;
    }

    this.roomOneValue = value;

    if (this.roomTwoValue === value) {
      this.roomTwoValue = this.firstAvailableRoomValue(value);
    }

    this.clearDragState();
  }

  selectRoomTwo(value: string): void {
    if (!this.roomFromValue(value)) {
      return;
    }

    this.roomTwoValue = value;

    if (this.roomOneValue === value) {
      this.roomOneValue = this.firstAvailableRoomValue(value);
    }

    this.clearDragState();
  }

  get roomPanels(): RoomPanel[] {
    return [
      {
        labelKey: 'workplace.assignments.panels.roomOne',
        room: this.roomOne,
        assignments: this.roomOne ? this.assignmentsForRoom(this.roomOne.id) : [],
      },
      {
        labelKey: 'workplace.assignments.panels.roomTwo',
        room: this.roomTwo,
        assignments: this.roomTwo ? this.assignmentsForRoom(this.roomTwo.id) : [],
      },
    ];
  }

  assignmentsForRoom(roomId: number | null): DeviceAssignment[] {
    if (roomId === null) {
      return [];
    }

    return this.activeAssignments.filter((assignment) => assignment.roomId === roomId);
  }

  handleDragStart(assignment: DeviceAssignment, event: DragEvent): void {
    this.draggedAssignmentId = assignment.id;
    this.activeDropRoomId = null;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(assignment.id));
    }
  }

  handleDragEnd(): void {
    this.clearDragState();
  }

  handleRoomDragOver(roomId: number | null, event: DragEvent): void {
    if (roomId === null || this.draggedAssignmentId === null) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    this.activeDropRoomId = roomId;
  }

  async handleRoomDrop(roomId: number | null, event: DragEvent): Promise<void> {
    event.preventDefault();

    const assignment = this.draggedAssignment(event);

    if (!assignment || roomId === null || assignment.roomId === roomId) {
      this.clearDragState();
      return;
    }

    try {
      await this.moveAssignmentToRoom(assignment, roomId);
    } finally {
      this.clearDragState();
    }
  }

  deviceName(deviceId: number): string {
    return this.workplaceFacade.getDeviceName(deviceId);
  }

  deviceById(deviceId: number): Device | null {
    return this.deviceControlFacade.devices().find((device) => device.id === deviceId) ?? null;
  }

  deviceIcon(device: Device | null): string {
    if (!device) {
      return '⚡';
    }

    const icons: Record<Device['type'], string> = {
      PLUG: '🔌',
      LIGHT: '💡',
      SWITCH: '🔘',
      SENSOR: '📡',
      OTHER: '⚡',
    };

    return icons[device.type] ?? '⚡';
  }

  deviceTypeLabel(type: Device['type']): string {
    const labelKeys: Record<Device['type'], string> = {
      PLUG: 'workplace.deviceTypes.plug',
      LIGHT: 'workplace.deviceTypes.light',
      SWITCH: 'workplace.deviceTypes.switch',
      SENSOR: 'workplace.deviceTypes.sensor',
      OTHER: 'workplace.deviceTypes.other',
    };

    return this.t(labelKeys[type]);
  }

  devicePowerLabel(deviceId: number): string {
    const device = this.deviceById(deviceId);

    if (!device) {
      return this.t('workplace.assignments.device.noPowerInfo');
    }

    return `${this.deviceTypeLabel(device.type)} - ${device.powerWatts} W`;
  }

  deviceStateLabel(device: Device | null): string {
    if (!device) {
      return this.t('workplace.assignments.device.notAvailable');
    }

    if (device.isOn) {
      return this.t('workplace.assignments.device.on');
    }

    if (device.isInMaintenance) {
      return this.t('workplace.assignments.device.maintenance');
    }

    return this.t('workplace.assignments.device.off');
  }

  roomLabel(value: string | null): string {
    if (!value || value === 'none') {
      return this.t('workplace.assignments.noRoom');
    }

    return this.workplaceFacade.getRoomName(Number(value));
  }

  private initializeRoomSelection(): void {
    this.roomOneValue = this.activeRooms[0] ? String(this.activeRooms[0].id) : null;
    this.roomTwoValue = this.firstAvailableRoomValue(this.roomOneValue);
    this.clearDragState();
  }

  private roomSelectionOptions(excludedValue: string | null): DropdownOption[] {
    return this.activeRooms
      .filter((room) => String(room.id) !== excludedValue)
      .map((room) => ({
        label: room.name,
        value: String(room.id),
        description: this.activeLocationName,
      }));
  }

  private roomFromValue(value: string | null): Room | null {
    if (!value) {
      return null;
    }

    return this.activeRooms.find((room) => String(room.id) === value) ?? null;
  }

  private firstAvailableRoomValue(excludedValue: string | null): string | null {
    const room = this.activeRooms.find((item) => String(item.id) !== excludedValue);
    return room ? String(room.id) : null;
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

  private async moveAssignmentToRoom(assignment: DeviceAssignment, destinationRoomId: number): Promise<void> {
    const warnings = this.buildImpactWarnings(assignment, assignment.roomId);

    if (warnings.length > 0) {
      const accepted = await this.confirmDialog.confirmSequence(warnings);

      if (!accepted) {
        return;
      }
    }

    const moved = await this.workplaceFacade.moveDeviceAssignment({
      assignmentId: assignment.id,
      locationId: assignment.locationId,
      roomId: destinationRoomId,
    });

    if (moved) {
      this.toastService.success(this.t('workplace.assignments.toasts.moveSuccess'));
      return;
    }

    this.toastService.error(this.t('workplace.assignments.toasts.moveError'));
  }

  private buildImpactWarnings(assignment: DeviceAssignment, originRoomId: number | null): ConfirmDialogOptions[] {
    const deviceIds = new Set<number>([assignment.deviceId]);
    const groupIds = this.relatedGroupIds([assignment.deviceId]);
    const warnings: ConfirmDialogOptions[] = [];

    const groupNames = this.deviceControlFacade
      .deviceGroups()
      .filter((group) => group.deviceIds.some((deviceId) => deviceId === assignment.deviceId))
      .map((group) => group.name);

    for (const groupName of groupNames) {
      warnings.push({
        title: this.t('workplace.assignments.warnings.groupTitle'),
        message: this.t('workplace.assignments.warnings.groupMessage', { group: groupName }),
        confirmLabel: this.t('common.continue'),
        cancelLabel: this.t('common.cancel'),
        tone: 'warning',
      });
    }

    if (this.hasRoutineImpact(deviceIds, groupIds, originRoomId)) {
      warnings.push({
        title: this.t('workplace.assignments.warnings.routinesTitle'),
        message: this.t('workplace.assignments.warnings.routinesMessage'),
        confirmLabel: this.t('common.continue'),
        cancelLabel: this.t('common.cancel'),
        tone: 'warning',
      });
    }

    if (this.hasModeImpact(deviceIds, groupIds, originRoomId)) {
      warnings.push({
        title: this.t('workplace.assignments.warnings.modesTitle'),
        message: this.t('workplace.assignments.warnings.modesMessage'),
        confirmLabel: this.t('common.continue'),
        cancelLabel: this.t('common.cancel'),
        tone: 'warning',
      });
    }

    return warnings;
  }

  private relatedGroupIds(deviceIds: number[]): Set<number> {
    const ids = new Set(deviceIds);
    return new Set(
      this.deviceControlFacade
        .deviceGroups()
        .filter((group) => group.deviceIds.some((deviceId) => ids.has(deviceId)))
        .map((group) => group.id)
    );
  }

  private hasRoutineImpact(deviceIds: Set<number>, groupIds: Set<number>, originRoomId: number | null): boolean {
    return this.deviceControlFacade.routines().some((routine) =>
      routine.enabled && this.routineImpactsMovement(routine, deviceIds, groupIds, originRoomId)
    );
  }

  private routineImpactsMovement(
    routine: Routine,
    deviceIds: Set<number>,
    groupIds: Set<number>,
    originRoomId: number | null
  ): boolean {
    if (routine.targetType === 'DEVICE') {
      return Boolean(routine.deviceId && deviceIds.has(routine.deviceId)) || deviceIds.has(routine.targetId);
    }

    if (routine.targetType === 'GROUP') {
      return Boolean(routine.groupId && groupIds.has(routine.groupId)) || groupIds.has(routine.targetId);
    }

    if (routine.targetType === 'ROOM') {
      return originRoomId !== null && routine.targetId === originRoomId;
    }

    return false;
  }

  private hasModeImpact(deviceIds: Set<number>, groupIds: Set<number>, originRoomId: number | null): boolean {
    const locationId = this.activeLocationId;

    return this.deviceControlFacade.operationModes().some((mode) => {
      if (!locationId || mode.locationId !== locationId || mode.status === 'ARCHIVED') {
        return false;
      }

      const modeDeviceIds = [
        ...mode.deviceIds,
        ...mode.turnOnDeviceIds,
        ...mode.turnOffDeviceIds,
        ...mode.keepOnDeviceIds,
      ];

      return (
        modeDeviceIds.some((deviceId) => deviceIds.has(deviceId)) ||
        mode.groupIds.some((groupId) => groupIds.has(groupId)) ||
        (originRoomId !== null && mode.roomIds.includes(originRoomId))
      );
    });
  }

  private draggedAssignment(event: DragEvent): DeviceAssignment | null {
    const rawId = this.draggedAssignmentId ?? Number(event.dataTransfer?.getData('text/plain') ?? '');

    if (!Number.isFinite(rawId) || rawId <= 0) {
      return null;
    }

    return this.activeAssignments.find((assignment) => assignment.id === rawId) ?? null;
  }

  private clearDragState(): void {
    this.draggedAssignmentId = null;
    this.activeDropRoomId = null;
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
