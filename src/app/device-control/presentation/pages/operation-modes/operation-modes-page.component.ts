import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DeviceControlFacade } from '../../../application/services/device-control.facade';
import { CreateOperationModeCommand } from '../../../application/commands/create-operation-mode.command';
import {
  OperationMode,
  OperationModePreview,
  OperationModeRoutine,
  OperationModeRoutineAction,
  OperationModeRoutineTargetType,
} from '../../../domain/model/operation-mode.entity';
import { Device } from '../../../domain/model/device.entity';
import { DeviceGroup } from '../../../domain/model/device-group.entity';
import { WorkplaceFacade } from '../../../../workplace/application/services/workplace.facade';
import { ActiveWorkplaceContextService } from '../../../../workplace/application/services/active-workplace-context.service';
import { ReportingFacade } from '../../../../reporting/application/services/reporting.facade';
import { NotificationsFacade } from '../../../../notifications/application/services/notifications.facade';
import { ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { AppTimePickerComponent } from '../../../../shared/presentation/components/app-time-picker/app-time-picker.component';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { ModalFormShellComponent } from '../../../../shared/presentation/components/modal-form-shell/modal-form-shell.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import { SettingToggleComponent } from '../../../../shared/presentation/components/setting-toggle/setting-toggle.component';
import { SeverityBadgeComponent } from '../../../../shared/presentation/components/severity-badge/severity-badge.component';

type ModeApplicationScope = 'WORKPLACE' | 'ROOM';
type ModeSchedule = 'ALL_DAY' | 'CUSTOM';

interface InternalRoutineDraft extends OperationModeRoutine {
  clientId: number;
}

@Component({
  selector: 'app-operation-modes-page',
  standalone: true,
  imports: [
    TranslateModule,
    FormsModule,
    AppButtonComponent,
    AppDropdownComponent,
    AppTimePickerComponent,
    EmptyStateComponent,
    ModalFormShellComponent,
    SectionCardComponent,
    SettingToggleComponent,
    SeverityBadgeComponent,
  ],
  templateUrl: './operation-modes-page.component.html',
  styleUrls: ['./operation-modes-page.component.scss'],
})
export class OperationModesPageComponent implements OnInit {
  name = '';
  description = '';
  locationId: number | null = null;
  applicationScope: ModeApplicationScope = 'WORKPLACE';
  selectedRoomId: number | null = null;
  schedule: ModeSchedule = 'ALL_DAY';
  startsAt = '08:00';
  endsAt = '18:00';
  selectedGoalIds = new Set<number>();
  ruleProfileId: number | null = null;
  preferenceId: number | null = null;
  applyRules = true;
  applyPreferences = true;
  preserveCriticalSound = true;
  createModalOpen = false;
  selectedModeId: number | null = null;
  preview: OperationModePreview | null = null;

  routineName = '';
  routineTargetType: OperationModeRoutineTargetType = 'DEVICE';
  routineTargetId: number | null = null;
  routineAction: OperationModeRoutineAction = 'TURN_ON';
  routineTime = '08:00';
  internalRoutines: InternalRoutineDraft[] = [];

  private nextRoutineClientId = 1;

  readonly applicationOptions: DropdownOption[] = [
    {
      label: '',
      labelKey: 'operationModes.applicationOptions.workplace',
      value: 'WORKPLACE',
      descriptionKey: 'operationModes.applicationDescriptions.workplace',
    },
    {
      label: '',
      labelKey: 'operationModes.applicationOptions.room',
      value: 'ROOM',
      descriptionKey: 'operationModes.applicationDescriptions.room',
    },
  ];

  readonly scheduleOptions: DropdownOption[] = [
    {
      label: '',
      labelKey: 'operationModes.scheduleOptions.allDay',
      value: 'ALL_DAY',
      descriptionKey: 'operationModes.scheduleDescriptions.allDay',
    },
    {
      label: '',
      labelKey: 'operationModes.scheduleOptions.custom',
      value: 'CUSTOM',
      descriptionKey: 'operationModes.scheduleDescriptions.custom',
    },
  ];

  readonly routineTargetTypeOptions: DropdownOption[] = [
    {
      label: '',
      labelKey: 'operationModes.routineTargetTypes.device',
      value: 'DEVICE',
      descriptionKey: 'operationModes.routineTargetDescriptions.device',
    },
    {
      label: '',
      labelKey: 'operationModes.routineTargetTypes.group',
      value: 'GROUP',
      descriptionKey: 'operationModes.routineTargetDescriptions.group',
    },
  ];

  readonly routineActionOptions: DropdownOption[] = [
    {
      label: '',
      labelKey: 'routines.actions.turnOn',
      value: 'TURN_ON',
      descriptionKey: 'operationModes.routineActionDescriptions.turnOn',
    },
    {
      label: '',
      labelKey: 'routines.actions.turnOff',
      value: 'TURN_OFF',
      descriptionKey: 'operationModes.routineActionDescriptions.turnOff',
    },
  ];

  constructor(
    readonly deviceControlFacade: DeviceControlFacade,
    readonly workplaceFacade: WorkplaceFacade,
    readonly reportingFacade: ReportingFacade,
    readonly notificationsFacade: NotificationsFacade,
    private readonly activeWorkplaceContext: ActiveWorkplaceContextService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.deviceControlFacade.loadDeviceControl(),
      this.workplaceFacade.loadWorkplace(),
      this.reportingFacade.loadReporting(),
      this.notificationsFacade.loadNotifications(),
    ]);

    const activeLocation = this.activeWorkplaceContext.ensureActiveLocation(
      this.workplaceFacade.locations()
    );

    this.locationId = activeLocation?.id ?? null;
  }

  get modes(): OperationMode[] {
    return this.deviceControlFacade.operationModes();
  }

  get modesInActiveWorkplace(): OperationMode[] {
    return this.locationId
      ? this.modes.filter((mode) => mode.locationId === this.locationId)
      : this.modes;
  }

  get activeMode(): OperationMode | null {
    return this.modesInActiveWorkplace.find((mode) => mode.status === 'ACTIVE') ?? null;
  }

  get selectedMode(): OperationMode | null {
    return this.modes.find((mode) => mode.id === this.selectedModeId) ?? null;
  }

  get selectedLocationName(): string {
    if (!this.locationId) {
      return this.t('operationModes.fallbacks.noSelectedSite');
    }

    return this.workplaceFacade.locations().find((location) => location.id === this.locationId)?.name
      ?? this.t('operationModes.fallbacks.siteUnavailable');
  }

  get locationValue(): string | null {
    return this.locationId ? String(this.locationId) : null;
  }

  get locationOptions(): DropdownOption[] {
    return this.workplaceFacade.locations().map((location) => ({
      label: location.name,
      value: String(location.id),
      description: location.address || this.t('operationModes.fallbacks.operationalSite'),
    }));
  }

  get roomValue(): string | null {
    return this.selectedRoomId ? String(this.selectedRoomId) : null;
  }

  get roomOptions(): DropdownOption[] {
    return this.availableRooms.map((room) => ({
      label: room.name,
      value: String(room.id),
      description: this.selectedLocationName,
    }));
  }

  get availableRooms() {
    return this.locationId
      ? this.workplaceFacade.rooms().filter((room) => room.locationId === this.locationId)
      : [];
  }

  get assignedDeviceIds(): Set<number> {
    if (!this.locationId) {
      return new Set<number>();
    }

    return new Set(
      this.workplaceFacade
        .deviceAssignments()
        .filter((assignment) => assignment.locationId === this.locationId)
        .map((assignment) => assignment.deviceId)
    );
  }

  get scopedDeviceIds(): Set<number> {
    if (!this.locationId) {
      return new Set<number>();
    }

    const assignments = this.workplaceFacade.deviceAssignments().filter((assignment) => {
      if (assignment.locationId !== this.locationId) {
        return false;
      }

      return this.applicationScope !== 'ROOM' || this.selectedRoomId === null
        ? true
        : assignment.roomId === this.selectedRoomId;
    });

    return new Set(assignments.map((assignment) => assignment.deviceId));
  }

  get availableDevices(): Device[] {
    const scopedIds = this.scopedDeviceIds;
    return this.deviceControlFacade.devices().filter((device) => scopedIds.has(device.id));
  }

  get availableGroups(): DeviceGroup[] {
    const scopedIds = this.scopedDeviceIds;
    return this.deviceControlFacade
      .deviceGroups()
      .filter((group) => group.deviceIds.length > 0 && group.deviceIds.every((deviceId) => scopedIds.has(deviceId)));
  }

  get routineTargetOptions(): DropdownOption[] {
    if (this.routineTargetType === 'GROUP') {
      return this.availableGroups.map((group) => ({
        label: group.name,
        value: String(group.id),
        description: this.t('operationModes.routineTargets.deviceCount', { count: group.deviceCount }),
      }));
    }

    return this.availableDevices.map((device) => ({
      label: device.name,
      value: String(device.id),
      description: `${device.room || this.t('devices.noRoom')} - ${device.powerWatts} W`,
      disabled: !device.canReceiveOperationalChanges,
    }));
  }

  get availableGoals() {
    const scopedDeviceIds = this.scopedDeviceIds;
    const roomIds = new Set(this.availableRooms.map((room) => room.id));
    const groupIds = new Set(this.availableGroups.map((group) => group.id));

    return this.reportingFacade.energyGoals().filter((goal) => {
      if (goal.scopeType === 'GENERAL') {
        return true;
      }

      if (goal.scopeType === 'WORKPLACE') {
        return goal.scopeId === this.locationId;
      }

      if (goal.scopeType === 'ROOM') {
        return Boolean(goal.scopeId && roomIds.has(goal.scopeId));
      }

      if (goal.scopeType === 'GROUP') {
        return Boolean(goal.scopeId && groupIds.has(goal.scopeId));
      }

      return Boolean(goal.scopeId && scopedDeviceIds.has(goal.scopeId));
    });
  }

  get ruleProfileValue(): string {
    return this.ruleProfileId ? String(this.ruleProfileId) : 'none';
  }

  get ruleOptions(): DropdownOption[] {
    const profiles = this.notificationsFacade.alertRuleProfiles().map((profile) => ({
      label: profile.name,
      value: String(profile.id),
      description: this.t('operationModes.rules.available'),
    }));

    return [
      {
        label: this.t('operationModes.rules.none'),
        value: 'none',
        description: this.t('operationModes.rules.noneDescription'),
      },
      ...profiles,
    ];
  }

  get preferenceValue(): string {
    return this.preferenceId ? String(this.preferenceId) : 'current';
  }

  get preferenceOptions(): DropdownOption[] {
    const currentPreference = this.selectedPreferenceId;

    return [
      {
        label: this.t('operationModes.preferences.current'),
        value: 'current',
        description: currentPreference
          ? this.t('operationModes.preferences.useRegistered')
          : this.t('operationModes.preferences.noneRegistered'),
      },
      ...(currentPreference
        ? [
            {
              label: this.t('operationModes.preferences.numbered', { id: currentPreference }),
              value: String(currentPreference),
              description: this.t('operationModes.preferences.applyThis'),
            },
          ]
        : []),
    ];
  }

  get selectedPreferenceId(): number | null {
    return this.notificationsFacade.notificationPreference()?.id ?? null;
  }

  get createDisabled(): boolean {
    return !this.locationId
      || !this.name.trim()
      || !this.hasRoutineForSubmit
      || (this.applicationScope === 'ROOM' && !this.selectedRoomId);
  }

  get hasCompleteRoutineDraft(): boolean {
    return Boolean(this.routineName.trim())
      && this.routineTargetId !== null
      && Number.isFinite(this.routineTargetId);
  }

  get hasRoutineForSubmit(): boolean {
    return this.internalRoutines.length > 0 || this.hasCompleteRoutineDraft;
  }

  get createDisabledReason(): string {
    if (!this.locationId) {
      return this.t('operationModes.validation.siteRequired');
    }

    if (!this.name.trim()) {
      return this.t('operationModes.validation.nameRequired');
    }

    if (this.applicationScope === 'ROOM' && !this.selectedRoomId) {
      return this.t('operationModes.validation.roomRequired');
    }

    if (!this.hasRoutineForSubmit && this.routineTargetOptions.length === 0) {
      return this.t('operationModes.validation.noTargets');
    }

    if (!this.hasRoutineForSubmit) {
      return this.t('operationModes.validation.routineRequired');
    }

    return '';
  }

  get modeWindowLabel(): string {
    return this.schedule === 'ALL_DAY'
      ? this.t('operationModes.scheduleOptions.allDay')
      : `${this.startsAt} - ${this.endsAt}`;
  }

  openCreateModal(): void {
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  selectLocation(value: string): void {
    const nextLocationId = Number(value);
    this.locationId = Number.isFinite(nextLocationId) ? nextLocationId : null;

    if (this.locationId) {
      this.activeWorkplaceContext.setActiveLocation(this.locationId);
    }

    this.selectedRoomId = null;
    this.internalRoutines = [];
    this.routineTargetId = null;
  }

  selectApplication(value: string): void {
    this.applicationScope = value as ModeApplicationScope;
    this.selectedRoomId = null;
    this.internalRoutines = [];
    this.routineTargetId = null;
  }

  selectRoom(value: string): void {
    const roomId = Number(value);
    this.selectedRoomId = Number.isFinite(roomId) ? roomId : null;
    this.internalRoutines = [];
    this.routineTargetId = null;
  }

  selectSchedule(value: string): void {
    this.schedule = value as ModeSchedule;
  }

  selectRoutineTargetType(value: string): void {
    this.routineTargetType = value as OperationModeRoutineTargetType;
    this.routineTargetId = null;
  }

  selectRoutineTarget(value: string): void {
    const targetId = Number(value);
    this.routineTargetId = Number.isFinite(targetId) ? targetId : null;
  }

  selectRoutineAction(value: string): void {
    this.routineAction = value as OperationModeRoutineAction;
  }

  selectRuleProfile(value: string): void {
    this.ruleProfileId = value === 'none' ? null : Number(value);
  }

  selectPreference(value: string): void {
    this.preferenceId = value === 'current' ? null : Number(value);
  }

  toggleGoal(goalId: number): void {
    if (this.selectedGoalIds.has(goalId)) {
      this.selectedGoalIds.delete(goalId);
      return;
    }

    this.selectedGoalIds.add(goalId);
  }

  addInternalRoutine(): void {
    const routine = this.getPendingRoutineDraft();

    if (!routine) {
      this.toastService.warning(this.t('operationModes.validation.routineDraftRequired'));
      return;
    }

    this.internalRoutines = [
      ...this.internalRoutines,
      {
        clientId: this.nextRoutineClientId++,
        ...routine,
      },
    ];

    this.routineName = '';
    this.routineTargetId = null;
  }

  removeInternalRoutine(clientId: number): void {
    this.internalRoutines = this.internalRoutines.filter((routine) => routine.clientId !== clientId);
  }

  async createMode(): Promise<void> {
    if (this.createDisabled || !this.locationId) {
      this.toastService.warning(this.createDisabledReason || this.t('operationModes.validation.minimumRequired'));
      return;
    }

    if (this.applicationScope === 'ROOM' && !this.selectedRoomId) {
      this.toastService.warning(this.t('operationModes.validation.roomRequired'));
      return;
    }

    const internalRoutines = this.buildInternalRoutinesForSubmit();

    const command: CreateOperationModeCommand = {
      locationId: this.locationId,
      name: this.name.trim(),
      description: this.description.trim(),
      roomIds: this.applicationScope === 'ROOM' && this.selectedRoomId ? [this.selectedRoomId] : [],
      groupIds: [],
      deviceIds: [],
      turnOnDeviceIds: [],
      turnOffDeviceIds: [],
      keepOnDeviceIds: [],
      goalIds: Array.from(this.selectedGoalIds),
      internalRoutines,
      allDay: this.schedule === 'ALL_DAY',
      startsAt: this.startsAt,
      endsAt: this.endsAt,
      ruleProfileId: this.ruleProfileId,
      preferenceId: this.preferenceId ?? this.selectedPreferenceId,
      applyRuleProfile: this.applyRules,
      applyNotificationPreference: this.applyPreferences,
      preserveCriticalSound: this.preserveCriticalSound,
    };

    const success = await this.deviceControlFacade.createOperationMode(command);
    if (!success) {
      this.toastService.error(this.t('operationModes.toasts.createError'));
      return;
    }

    this.toastService.success(this.t('operationModes.toasts.createSuccess'));
    this.resetForm();
    this.closeCreateModal();
  }

  async selectMode(mode: OperationMode): Promise<void> {
    this.selectedModeId = mode.id;
    this.preview = await this.deviceControlFacade.previewOperationMode(mode.id);
  }

  async activateMode(mode: OperationMode): Promise<void> {
    const activeMode = this.activeMode;
    if (activeMode && activeMode.id !== mode.id) {
      const accepted = await this.confirmDialog.confirm({
        title: this.t('operationModes.confirm.replaceTitle'),
        message: this.t('operationModes.confirm.replaceMessage'),
        confirmLabel: this.t('routines.enable'),
        cancelLabel: this.t('common.cancel'),
        tone: 'warning',
      });

      if (!accepted) {
        return;
      }
    }

    const result = await this.deviceControlFacade.activateOperationMode(mode.id);
    if (!result) {
      this.toastService.error(this.t('operationModes.toasts.activateError'));
      return;
    }

    this.selectedModeId = mode.id;
    this.preview = await this.deviceControlFacade.previewOperationMode(mode.id);
    this.toastService.info(result.evidence);
  }

  async archiveMode(mode: OperationMode): Promise<void> {
    const accepted = await this.confirmDialog.confirm({
      title: this.t('operationModes.confirm.archiveTitle'),
      message: this.t('operationModes.confirm.archiveMessage', { name: mode.name }),
      confirmLabel: this.t('operationModes.actions.archive'),
      cancelLabel: this.t('common.keep'),
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    const success = await this.deviceControlFacade.archiveOperationMode(mode.id);
    if (success) {
      this.selectedModeId = null;
      this.preview = null;
      this.toastService.info(this.t('operationModes.toasts.archived'));
    }
  }

  getModeRoomName(mode: OperationMode): string {
    if (mode.roomIds.length === 0) {
      return this.t('operationModes.applicationOptions.workplace');
    }

    return this.workplaceFacade.rooms().find((room) => room.id === mode.roomIds[0])?.name
      ?? this.t('operationModes.fallbacks.roomUnavailable');
  }

  getModeScheduleLabel(mode: OperationMode): string {
    return mode.allDay ? this.t('operationModes.scheduleOptions.allDay') : `${mode.startsAt} - ${mode.endsAt}`;
  }

  getModeStatusLabel(mode: OperationMode): string {
    const labels: Record<string, string> = {
      ACTIVE: 'operationModes.status.active',
      INACTIVE: 'operationModes.status.inactive',
      DRAFT: 'operationModes.status.inactive',
      ARCHIVED: 'operationModes.status.archived',
    };

    return this.t(labels[mode.status] ?? 'operationModes.status.inactive');
  }

  getRuleProfileName(profileId: number | null): string {
    if (!profileId) {
      return this.t('operationModes.rules.none');
    }

    return this.notificationsFacade.alertRuleProfiles().find((profile) => profile.id === profileId)?.name
      ?? this.t('nav.rules');
  }

  getGoalName(goalId: number): string {
    return this.reportingFacade.energyGoals().find((goal) => goal.id === goalId)?.title
      ?? this.t('operationModes.goals.fallback', { id: goalId });
  }

  getInternalRoutineTargetName(routine: OperationModeRoutine): string {
    if (routine.targetType === 'GROUP') {
      return this.deviceControlFacade.deviceGroups().find((group) => group.id === routine.targetId)?.name
        ?? this.t('operationModes.fallbacks.groupUnavailable');
    }

    return this.deviceControlFacade.devices().find((device) => device.id === routine.targetId)?.name
      ?? this.t('operationModes.fallbacks.deviceUnavailable');
  }

  getInternalRoutineActionLabel(routine: OperationModeRoutine): string {
    return routine.action === 'TURN_ON'
      ? this.t('routines.actions.turnOn')
      : this.t('routines.actions.turnOff');
  }

  getRoutineTargetTypeLabelKey(targetType: OperationModeRoutineTargetType): string {
    return targetType === 'GROUP'
      ? 'operationModes.routineTargetTypes.group'
      : 'operationModes.routineTargetTypes.device';
  }

  getRoutineTargetTypeLabel(): string {
    return this.t(this.getRoutineTargetTypeLabelKey(this.routineTargetType));
  }

  getPreviewDeviceNames(): string[] {
    return this.preview?.affectedDeviceIds.map((deviceId) => this.deviceControlFacade.getDeviceName(deviceId)) ?? [];
  }

  private resetForm(): void {
    this.name = '';
    this.description = '';
    this.applicationScope = 'WORKPLACE';
    this.selectedRoomId = null;
    this.schedule = 'ALL_DAY';
    this.startsAt = '08:00';
    this.endsAt = '18:00';
    this.selectedGoalIds.clear();
    this.ruleProfileId = null;
    this.preferenceId = null;
    this.applyRules = true;
    this.applyPreferences = true;
    this.preserveCriticalSound = true;
    this.routineName = '';
    this.routineTargetType = 'DEVICE';
    this.routineTargetId = null;
    this.routineAction = 'TURN_ON';
    this.routineTime = '08:00';
    this.internalRoutines = [];
  }

  private getPendingRoutineDraft(): OperationModeRoutine | null {
    if (!this.hasCompleteRoutineDraft || this.routineTargetId === null) {
      return null;
    }

    return {
      name: this.routineName.trim(),
      targetType: this.routineTargetType,
      targetId: this.routineTargetId,
      action: this.routineAction,
      triggerTime: this.routineTime,
      enabled: true,
    };
  }

  private buildInternalRoutinesForSubmit(): OperationModeRoutine[] {
    const committedRoutines = this.internalRoutines.map(({ clientId, ...routine }) => routine);
    const pendingRoutine = this.getPendingRoutineDraft();

    return pendingRoutine ? [...committedRoutines, pendingRoutine] : committedRoutines;
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
