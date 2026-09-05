import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DeviceControlFacade } from '../../../application/services/device-control.facade';
import {
  Routine,
  RoutineAction,
  RoutineRepeatType,
  RoutineTargetType,
} from '../../../domain/model/routine.entity';
import { Device, DeviceStatus } from '../../../domain/model/device.entity';
import { WorkplaceFacade } from '../../../../workplace/application/services/workplace.facade';
import { ActiveWorkplaceContextService } from '../../../../workplace/application/services/active-workplace-context.service';

import { RoutineCardComponent } from '../../components/routine-card/routine-card.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppDatePickerComponent } from '../../../../shared/presentation/components/app-date-picker/app-date-picker.component';
import { AppNumberStepperComponent } from '../../../../shared/presentation/components/app-number-stepper/app-number-stepper.component';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppTimePickerComponent } from '../../../../shared/presentation/components/app-time-picker/app-time-picker.component';
import { ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { ModalFormShellComponent } from '../../../../shared/presentation/components/modal-form-shell/modal-form-shell.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import { RoutineConflictCheckerService } from '../../../domain/services/routine-conflict-checker.service';

type TimePart = 'hour' | 'minute';

@Component({
  selector: 'app-routines-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    AppDropdownComponent,
    AppDatePickerComponent,
    AppNumberStepperComponent,
    AppButtonComponent,
    AppTimePickerComponent,
    EmptyStateComponent,
    ModalFormShellComponent,
    SectionCardComponent,
    RoutineCardComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './routines-page.component.html',
  styleUrls: ['./routines-page.component.scss'],
})
export class RoutinesPageComponent implements OnInit {
  name = '';
  targetType: RoutineTargetType = 'DEVICE';
  targetId: number | null = null;
  action: RoutineAction = 'TURN_ON';
  repeatType: RoutineRepeatType = 'DAILY';
  selectedDays = new Set<string>();
  intervalDays = 2;
  startsOn = this.toInputDate(new Date());

  selectedHour = 8;
  selectedMinute = 0;
  createModalOpen = false;
  removingRoutineIds = new Set<number>();

  readonly targetTypeOptions: DropdownOption[] = [
    {
      label: '',
      labelKey: 'routines.targetTypes.device',
      value: 'DEVICE',
      descriptionKey: 'routines.targetTypeDescriptions.device',
    },
    {
      label: '',
      labelKey: 'routines.targetTypes.group',
      value: 'GROUP',
      descriptionKey: 'routines.targetTypeDescriptions.group',
    },
    {
      label: '',
      labelKey: 'routines.targetTypes.room',
      value: 'ROOM',
      descriptionKey: 'routines.targetTypeDescriptions.room',
    },
    {
      label: '',
      labelKey: 'routines.targetTypes.workplace',
      value: 'WORKPLACE',
      descriptionKey: 'routines.targetTypeDescriptions.workplace',
    },
  ];

  readonly cleanActionOptions: DropdownOption[] = [
    {
      label: '',
      labelKey: 'routines.actions.turnOn',
      value: 'TURN_ON',
      descriptionKey: 'routines.actionDescriptions.turnOn',
    },
    {
      label: '',
      labelKey: 'routines.actions.turnOff',
      value: 'TURN_OFF',
      descriptionKey: 'routines.actionDescriptions.turnOff',
    },
  ];

  readonly repeatOptions: DropdownOption[] = [
    {
      label: '',
      labelKey: 'routines.repeat.once',
      value: 'ONCE',
      descriptionKey: 'routines.repeatDescriptions.once',
    },
    {
      label: '',
      labelKey: 'routines.repeat.daily',
      value: 'DAILY',
      descriptionKey: 'routines.repeatDescriptions.daily',
    },
    {
      label: '',
      labelKey: 'routines.repeat.weekly',
      value: 'WEEKLY',
      descriptionKey: 'routines.repeatDescriptions.weekly',
    },
    {
      label: '',
      labelKey: 'routines.repeat.customInterval',
      value: 'CUSTOM_INTERVAL',
      descriptionKey: 'routines.repeatDescriptions.customInterval',
    },
  ];

  readonly weekDays = [
    { label: 'Lun', labelKey: 'routines.weekDays.monShort', nameKey: 'routines.weekDays.mon', value: 'MON' },
    { label: 'Mar', labelKey: 'routines.weekDays.tueShort', nameKey: 'routines.weekDays.tue', value: 'TUE' },
    { label: 'Mie', labelKey: 'routines.weekDays.wedShort', nameKey: 'routines.weekDays.wed', value: 'WED' },
    { label: 'Jue', labelKey: 'routines.weekDays.thuShort', nameKey: 'routines.weekDays.thu', value: 'THU' },
    { label: 'Vie', labelKey: 'routines.weekDays.friShort', nameKey: 'routines.weekDays.fri', value: 'FRI' },
    { label: 'Sab', labelKey: 'routines.weekDays.satShort', nameKey: 'routines.weekDays.sat', value: 'SAT' },
    { label: 'Dom', labelKey: 'routines.weekDays.sunShort', nameKey: 'routines.weekDays.sun', value: 'SUN' },
  ];

  constructor(
    readonly deviceControlFacade: DeviceControlFacade,
    readonly workplaceFacade: WorkplaceFacade,
    private readonly activeWorkplaceContext: ActiveWorkplaceContextService,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly routineConflictChecker: RoutineConflictCheckerService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.deviceControlFacade.loadDeviceControl(),
      this.workplaceFacade.loadWorkplace(),
    ]);

    this.activeWorkplaceContext.ensureActiveLocation(this.workplaceFacade.locations());
  }

  get activeRoutineCount(): number {
    return this.displayedRoutines
      .filter((routine) => routine.enabled).length;
  }

  get inactiveRoutineCount(): number {
    return this.displayedRoutines
      .filter((routine) => !routine.enabled).length;
  }

  get formattedHour(): string {
    return this.formatTimePart(this.selectedHour);
  }

  get formattedMinute(): string {
    return this.formatTimePart(this.selectedMinute);
  }

  get time(): string {
    return `${this.formattedHour}:${this.formattedMinute}`;
  }

  get minStartsOn(): string {
    return this.toInputDate(new Date());
  }

  openCreateModal(): void {
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  get targetValue(): string | null {
    return this.targetId !== null ? String(this.targetId) : null;
  }

  get targetOptions(): DropdownOption[] {
    if (this.targetType === 'GROUP') {
      return this.availableGroups.map((group) => ({
        label: group.name,
        value: String(group.id),
        description: this.t('routines.targetOptions.deviceCount', { count: group.deviceCount }),
        disabled: !group.hasDevices,
      }));
    }

    if (this.targetType === 'ROOM') {
      return this.availableRooms.map((room) => ({
        label: room.name,
        value: String(room.id),
        description: this.workplaceFacade.getLocationName(room.locationId),
      }));
    }

    if (this.targetType === 'WORKPLACE') {
      return this.availableLocations.map((location) => ({
        label: location.name,
        value: String(location.id),
        description: location.address,
      }));
    }

    return this.availableDevices.map((device) => ({
      label: device.name,
      value: String(device.id),
      description: `${device.room || this.t('devices.noRoom')} - ${device.powerWatts} W - ${this.getDeviceStatusLabel(device)}`,
      disabled: !device.canReceiveOperationalChanges,
    }));
  }

  get activeLocationId(): number | null {
    return this.activeWorkplaceContext.activeLocationId();
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

  get availableLocations() {
    const locationId = this.activeLocationId;
    return this.workplaceFacade.locations().filter((location) => location.id === locationId);
  }

  get availableRooms() {
    const locationId = this.activeLocationId;
    return this.workplaceFacade.rooms().filter((room) => room.locationId === locationId);
  }

  get availableDevices() {
    const activeDeviceIds = this.activeDeviceIds;
    return this.deviceControlFacade.devices().filter((device) => activeDeviceIds.has(device.id));
  }

  get availableGroups() {
    const activeDeviceIds = this.activeDeviceIds;
    return this.deviceControlFacade
      .deviceGroups()
      .filter((group) => group.deviceIds.some((deviceId) => activeDeviceIds.has(deviceId)));
  }

  get displayedRoutines(): Routine[] {
    const locationId = this.activeLocationId;
    const deviceIds = this.activeDeviceIds;
    const roomIds = new Set(this.availableRooms.map((room) => room.id));
    const groupIds = new Set(this.availableGroups.map((group) => group.id));

    return this.deviceControlFacade.routines().filter((routine) => {
      if (!locationId) {
        return false;
      }

      if (routine.targetType === 'WORKPLACE') {
        return routine.targetId === locationId;
      }

      if (routine.targetType === 'ROOM') {
        return roomIds.has(routine.targetId);
      }

      if (routine.targetType === 'GROUP') {
        return Boolean(routine.groupId && groupIds.has(routine.groupId)) || groupIds.has(routine.targetId);
      }

      return Boolean(routine.deviceId && deviceIds.has(routine.deviceId)) || deviceIds.has(routine.targetId);
    });
  }

  get targetPlaceholder(): string {
    const placeholders: Record<RoutineTargetType, string> = {
      DEVICE: 'routines.placeholders.device',
      GROUP: 'routines.placeholders.group',
      ROOM: 'routines.placeholders.room',
      WORKPLACE: 'routines.placeholders.workplace',
    };

    return this.t(placeholders[this.targetType]);
  }

  get targetLabel(): string {
    return this.t(this.targetLabelKey);
  }

  get targetLabelKey(): string {
    const labels: Record<RoutineTargetType, string> = {
      DEVICE: 'routines.targetTypes.device',
      GROUP: 'routines.targetTypes.group',
      ROOM: 'routines.targetTypes.room',
      WORKPLACE: 'routines.targetTypes.workplace',
    };

    return labels[this.targetType];
  }

  get actionLabel(): string {
    return this.t(this.actionLabelKey);
  }

  get actionLabelKey(): string {
    return this.action === 'TURN_ON'
      ? 'routines.actions.turnOn'
      : 'routines.actions.turnOff';
  }

  getDeviceStatusLabel(device: Device): string {
    const labels: Record<DeviceStatus, string> = {
      ON: 'devices.status.on',
      OFF: 'devices.status.off',
      MAINTENANCE: 'devices.status.maintenance',
      REMOVED: 'devices.status.removed',
    };

    return this.t(labels[device.status] ?? 'devices.status.unknown');
  }

  selectTargetType(value: string): void {
    this.targetType = value as RoutineTargetType;
    this.targetId = null;
  }

  selectTarget(value: string): void {
    this.targetId = Number(value);
  }

  selectAction(value: string): void {
    this.action = value as RoutineAction;
  }

  selectRepeatType(value: string): void {
    this.repeatType = value as RoutineRepeatType;
  }

  selectTime(value: string): void {
    const [hour, minute] = value.split(':').map(Number);

    if (Number.isFinite(hour) && hour >= 0 && hour <= 23) {
      this.selectedHour = hour;
    }

    if (Number.isFinite(minute) && minute >= 0 && minute <= 59) {
      this.selectedMinute = minute;
    }
  }

  onIntervalDaysChange(value: number | null): void {
    this.intervalDays = Math.max(1, value ?? 1);
  }

  toggleDay(day: string): void {
    if (this.selectedDays.has(day)) {
      this.selectedDays.delete(day);
      return;
    }

    this.selectedDays.add(day);
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays.has(day);
  }

  increaseHour(): void {
    this.selectedHour = this.selectedHour === 23 ? 0 : this.selectedHour + 1;
  }

  decreaseHour(): void {
    this.selectedHour = this.selectedHour === 0 ? 23 : this.selectedHour - 1;
  }

  increaseMinute(): void {
    this.selectedMinute = this.selectedMinute === 59 ? 0 : this.selectedMinute + 1;
  }

  decreaseMinute(): void {
    this.selectedMinute = this.selectedMinute === 0 ? 59 : this.selectedMinute - 1;
  }

  handleTimeKeydown(event: KeyboardEvent, part: TimePart): void {
    const allowedNavigationKeys = [
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];

    if (allowedNavigationKeys.includes(event.key)) {
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      part === 'hour' ? this.increaseHour() : this.increaseMinute();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      part === 'hour' ? this.decreaseHour() : this.decreaseMinute();
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    this.pushTimeDigit(part, event.key);
  }

  selectTimeInputContent(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  async createRoutine(): Promise<void> {
    if (!this.activeLocationId) {
      this.toastService.warning(this.t('routines.validation.activeSiteRequired'));
      return;
    }

    if (!this.targetId || !this.name.trim()) {
      return;
    }

    if (this.repeatType === 'WEEKLY' && this.selectedDays.size === 0) {
      this.toastService.warning(this.t('routines.validation.weeklyDayRequired'));
      return;
    }

    const hasConflict = this.routineConflictChecker.hasConflict(this.displayedRoutines, {
      action: this.action,
      time: this.time,
      targetType: this.targetType,
      targetId: this.targetId,
    });

    if (hasConflict) {
      const accepted = await this.confirmDialog.confirm({
        title: this.t('routines.conflict.title'),
        message: this.t('routines.conflict.message'),
        confirmLabel: this.t('common.continue'),
        cancelLabel: this.t('common.cancel'),
        tone: 'warning',
      });

      if (!accepted) {
        return;
      }
    }

    const success = await this.deviceControlFacade.createRoutine({
      name: this.name.trim(),
      action: this.action,
      time: this.time,
      targetType: this.targetType,
      targetId: this.targetId,
      deviceId: this.targetType === 'DEVICE' ? this.targetId : null,
      groupId: this.targetType === 'GROUP' ? this.targetId : null,
      repeatType: this.repeatType,
      daysOfWeek: this.repeatType === 'WEEKLY'
        ? Array.from(this.selectedDays).join(',')
        : null,
      intervalDays: this.repeatType === 'CUSTOM_INTERVAL'
        ? Math.max(1, Number(this.intervalDays) || 1)
        : 1,
      startsOn: this.repeatType === 'ONCE' ? this.startsOn : null,
    });

    if (success) {
      this.name = '';
      this.targetType = 'DEVICE';
      this.targetId = null;
      this.action = 'TURN_ON';
      this.repeatType = 'DAILY';
      this.selectedDays.clear();
      this.intervalDays = 2;
      this.startsOn = this.toInputDate(new Date());
      this.selectedHour = 8;
      this.selectedMinute = 0;
      this.closeCreateModal();
      this.toastService.success(this.t('routines.createOperationalSuccess'));
    }
  }

  async toggleRoutine(routine: Routine): Promise<void> {
    const viewport = this.captureViewport();
    this.stabilizeViewport(viewport);

    await this.deviceControlFacade.updateRoutineStatus({
      routineId: routine.id,
      enabled: !routine.enabled,
    });

    this.stabilizeViewport(viewport);
    this.toastService.info(
      routine.enabled
        ? this.t('routines.toasts.paused')
        : this.t('routines.toasts.activated')
    );
  }

  async deleteRoutine(routineId: number): Promise<void> {
    if (this.removingRoutineIds.has(routineId)) {
      return;
    }

    const routine = this.deviceControlFacade.routines().find((item) => item.id === routineId);
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('routines.delete.title'),
      message: this.t('routines.delete.message', {
        name: routine?.name ?? this.t('routines.delete.fallbackName'),
      }),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.keep'),
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

    const viewport = this.captureViewport();
    this.markRoutineAsRemoving(routineId, true);
    this.stabilizeViewport(viewport);
    await this.delay(760);

    const success = await this.deviceControlFacade.deleteRoutine(routineId);
    this.stabilizeViewport(viewport);

    if (success) {
      this.toastService.info(this.t('routines.toasts.deleted'));
      return;
    }

    this.markRoutineAsRemoving(routineId, false);
    this.toastService.error(this.t('routines.deleteError'));
  }

  isRoutineRemoving(routineId: number): boolean {
    return this.removingRoutineIds.has(routineId);
  }

  private pushTimeDigit(part: TimePart, digit: string): void {
    const maxValue = part === 'hour' ? 23 : 59;
    const currentValue = part === 'hour' ? this.selectedHour : this.selectedMinute;

    const currentText = this.formatTimePart(currentValue);
    const candidateText = `${currentText.at(-1) ?? '0'}${digit}`;
    const candidateValue = Number(candidateText);

    const nextValue =
      candidateValue <= maxValue
        ? candidateValue
        : Number(digit);

    if (part === 'hour') {
      this.selectedHour = nextValue;
      return;
    }

    this.selectedMinute = nextValue;
  }

  private formatTimePart(value: number): string {
    return String(value).padStart(2, '0');
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private markRoutineAsRemoving(routineId: number, removing: boolean): void {
    const next = new Set(this.removingRoutineIds);

    if (removing) {
      next.add(routineId);
    } else {
      next.delete(routineId);
    }

    this.removingRoutineIds = next;
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
