import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DeviceControlFacade } from '../../../../device-control/application/services/device-control.facade';
import { EnergyReading } from '../../../../energy-monitoring/domain/model/energy-reading.entity';
import { ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';
import { ActiveWorkplaceContextService } from '../../../../workplace/application/services/active-workplace-context.service';
import { WorkplaceFacade } from '../../../../workplace/application/services/workplace.facade';
import { AppDatePickerComponent } from '../../../../shared/presentation/components/app-date-picker/app-date-picker.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { AppNumberStepperComponent } from '../../../../shared/presentation/components/app-number-stepper/app-number-stepper.component';
import { AppTimePickerComponent } from '../../../../shared/presentation/components/app-time-picker/app-time-picker.component';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { ModalFormShellComponent } from '../../../../shared/presentation/components/modal-form-shell/modal-form-shell.component';

import { ReportingFacade } from '../../../application/services/reporting.facade';
import { EnergyGoal, EnergyGoalScopeType } from '../../../domain/model/energy-goal.entity';

import {
  EnergyGoalInsight,
  GoalProgressCardComponent,
} from '../../components/goal-progress-card/goal-progress-card.component';

@Component({
  selector: 'app-energy-goals-page',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    TranslateModule,
    LoadingSpinnerComponent,
    GoalProgressCardComponent,
    AppDatePickerComponent,
    AppNumberStepperComponent,
    AppDropdownComponent,
    AppTimePickerComponent,
    AppButtonComponent,
    EmptyStateComponent,
    ModalFormShellComponent,
  ],
  templateUrl: './energy-goals-page.component.html',
  styleUrls: ['./energy-goals-page.component.scss'],
})
export class EnergyGoalsPageComponent implements OnInit {
  createModalOpen = false;
  title = '';
  targetKilowattHours: number | null = null;
  deadline = '';
  scopeType: EnergyGoalScopeType = 'WORKPLACE';
  scopeTargetId = '';
  activeFrom = '00:00';
  activeTo = '00:00';

  readonly scopeOptions: DropdownOption[] = [
    {
      label: 'Una sede',
      labelKey: 'reporting.goals.scopeOptions.workplace',
      value: 'WORKPLACE',
      description: 'Mide dispositivos asignados a un centro energetico.',
      descriptionKey: 'reporting.goals.scopeDescriptions.workplace',
    },
    {
      label: 'Una habitacion',
      labelKey: 'reporting.goals.scopeOptions.room',
      value: 'ROOM',
      description: 'Mide dispositivos asignados a una habitacion.',
      descriptionKey: 'reporting.goals.scopeDescriptions.room',
    },
    {
      label: 'Un grupo',
      labelKey: 'reporting.goals.scopeOptions.group',
      value: 'GROUP',
      description: 'Mide los dispositivos incluidos en un grupo.',
      descriptionKey: 'reporting.goals.scopeDescriptions.group',
    },
    {
      label: 'Un dispositivo',
      labelKey: 'reporting.goals.scopeOptions.device',
      value: 'DEVICE',
      description: 'Mide solo las lecturas de un equipo.',
      descriptionKey: 'reporting.goals.scopeDescriptions.device',
    },
  ];

  constructor(
    readonly reportingFacade: ReportingFacade,
    readonly deviceControlFacade: DeviceControlFacade,
    readonly workplaceFacade: WorkplaceFacade,
    private readonly activeWorkplaceContext: ActiveWorkplaceContextService,
    private readonly confirmDialogService: ConfirmDialogService,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.reportingFacade.loadReporting(),
      this.workplaceFacade.loadWorkplace(),
      this.deviceControlFacade.loadDeviceControl(),
    ]);

    this.activeWorkplaceContext.ensureActiveLocation(this.workplaceFacade.locations());

    if (this.reportingFacade.error()) {
      this.toastService.error(this.t('reporting.goals.toasts.loadError'));
    }
  }

  async createGoal(): Promise<void> {
  const title = this.title.trim();

  if (!title) {
    this.toastService.warning(this.t('reporting.goals.toasts.nameRequired'));
    return;
  }

  if (title.length < 4) {
    this.toastService.warning(this.t('reporting.goals.toasts.nameMinLength'));
    return;
  }

  if (!this.targetKilowattHours || this.targetKilowattHours <= 0) {
    this.toastService.warning(this.t('reporting.goals.toasts.targetRequired'));
    return;
  }

  if (!this.deadline) {
    this.toastService.warning(this.t('reporting.goals.toasts.deadlineRequired'));
    return;
  }

  if (this.isPastDate(this.deadline)) {
    this.toastService.warning(this.t('reporting.goals.toasts.deadlinePast'));
    return;
  }

  if (this.activeFrom === this.activeTo) {
    this.toastService.warning(this.t('reporting.goals.toasts.timeWindowInvalid'));
    return;
  }

  const scopeId = this.resolveScopeId();
  const scopeName = this.resolveScopeName(scopeId);

  if (this.scopeType !== 'GENERAL' && !scopeId) {
    this.toastService.warning(this.t('reporting.goals.toasts.scopeTargetRequired'));
    return;
  }

  const success = await this.reportingFacade.createEnergyGoal({
    title,
    targetKilowattHours: Number(this.targetKilowattHours),
    deadline: this.deadline,
    scopeType: this.scopeType,
    scopeId,
    scopeName,
    activeFrom: this.activeFrom,
    activeTo: this.activeTo,
  });

  if (success) {
    this.resetGoalForm();
    this.createModalOpen = false;
    this.toastService.success(this.t('reporting.goalCreateSuccess'));
    return;
  }

  this.toastService.error(this.t('reporting.goalCreateError'));
}

  async deleteGoal(goalId: number): Promise<void> {
  const confirmed = await this.confirmDialogService.confirm({
    title: this.t('reporting.goals.deleteDialog.title'),
    message: this.t('reporting.goals.deleteDialog.message'),
    confirmLabel: this.t('reporting.goals.deleteDialog.confirm'),
    cancelLabel: this.t('reporting.goals.deleteDialog.cancel'),
    tone: 'danger',
  });

  if (!confirmed) {
    return;
  }

  const success = await this.reportingFacade.deleteEnergyGoal(goalId);

  if (success) {
    this.toastService.info(this.t('reporting.goals.toasts.deleteSuccess'));
    return;
  }

  this.toastService.error(this.t('reporting.goalDeleteError'));
}

  openCreateGoalModal(): void {
    if (!this.scopeTargetId) {
      this.scopeTargetId = this.defaultScopeTargetId(this.scopeType);
    }

    this.createModalOpen = true;
  }

  closeCreateGoalModal(): void {
    this.createModalOpen = false;
  }

  onScopeChange(value: string): void {
    this.scopeType = value as EnergyGoalScopeType;
    this.scopeTargetId = this.defaultScopeTargetId(this.scopeType);
  }

  onScopeTargetChange(value: string): void {
    this.scopeTargetId = value;
  }

  get scopeTargetLabel(): string {
    const labels: Record<EnergyGoalScopeType, string> = {
      GENERAL: 'reporting.goals.scopeTargetLabels.general',
      WORKPLACE: 'reporting.goals.scopeTargetLabels.workplace',
      ROOM: 'reporting.goals.scopeTargetLabels.room',
      DEVICE: 'reporting.goals.scopeTargetLabels.device',
      GROUP: 'reporting.goals.scopeTargetLabels.group',
    };

    return this.t(labels[this.scopeType]);
  }

  get scopeTargetPlaceholder(): string {
    const placeholders: Record<EnergyGoalScopeType, string> = {
      GENERAL: 'reporting.goals.scopeTargetPlaceholders.general',
      WORKPLACE: 'reporting.goals.scopeTargetPlaceholders.workplace',
      ROOM: 'reporting.goals.scopeTargetPlaceholders.room',
      DEVICE: 'reporting.goals.scopeTargetPlaceholders.device',
      GROUP: 'reporting.goals.scopeTargetPlaceholders.group',
    };

    return this.t(placeholders[this.scopeType]);
  }

  get scopeTargetOptions(): DropdownOption[] {
    const activeLocationId = this.activeWorkplaceContext.activeLocationId();
    const activeDeviceIds = this.deviceIdsForLocation(activeLocationId);

    if (this.scopeType === 'WORKPLACE') {
      return this.workplaceFacade
        .locations()
        .filter((location) => !activeLocationId || location.id === activeLocationId)
        .map((location) => ({
          label: location.name,
          value: String(location.id),
          description: location.address,
        }));
    }

    if (this.scopeType === 'ROOM') {
      return this.workplaceFacade
        .rooms()
        .filter((room) => !activeLocationId || room.locationId === activeLocationId)
        .map((room) => ({
          label: room.name,
          value: String(room.id),
          description: `${this.workplaceFacade.getLocationName(room.locationId)} - ${room.floor}`,
        }));
    }

    if (this.scopeType === 'DEVICE') {
      return this.deviceControlFacade
        .devices()
        .filter((device) => !activeLocationId || activeDeviceIds.has(device.id))
        .map((device) => ({
          label: device.name,
          value: String(device.id),
          description: `${device.room} - ${device.powerWatts} W - ${device.status}`,
        }));
    }

    if (this.scopeType === 'GROUP') {
      return this.deviceControlFacade
        .deviceGroups()
        .filter((group) => !activeLocationId || group.deviceIds.some((deviceId) => activeDeviceIds.has(deviceId)))
        .map((group) => ({
          label: group.name,
          value: String(group.id),
          description: this.t('reporting.goals.deviceCountDescription', {
            count: group.deviceCount,
          }),
          disabled: !group.hasDevices,
        }));
    }

    return [];
  }

  get selectedScopeId(): number | null {
    if (this.scopeType === 'GENERAL' || !this.scopeTargetId) {
      return null;
    }

    return Number(this.scopeTargetId);
  }

  get selectedScopeName(): string {
    if (this.scopeType === 'WORKPLACE') {
      return this.workplaceFacade
        .locations()
        .find((location) => location.id === this.selectedScopeId)?.name ??
        this.t('reporting.goals.scopeTargetLabels.workplace');
    }

    if (this.scopeType === 'ROOM') {
      return this.workplaceFacade
        .rooms()
        .find((room) => room.id === this.selectedScopeId)?.name ??
        this.t('reporting.goals.scopeTargetLabels.room');
    }

    if (this.scopeType === 'DEVICE') {
      return this.deviceControlFacade
            .devices()
        .find((device) => device.id === this.selectedScopeId)?.name ??
        this.t('reporting.goals.scopeTargetLabels.device');
    }

    if (this.scopeType === 'GROUP') {
      return this.deviceControlFacade
        .deviceGroups()
        .find((group) => group.id === this.selectedScopeId)?.name ??
        this.t('reporting.goals.scopeTargetLabels.group');
    }

    return this.t('reporting.goals.generalOperation');
  }

  get canCreateGoal(): boolean {
    const hasScopeTarget = !!this.scopeTargetId;
    return Boolean(
      !this.reportingFacade.loading() &&
      this.title.trim() &&
      this.targetKilowattHours &&
      this.deadline &&
      this.activeFrom &&
      this.activeTo &&
      hasScopeTarget
    );
  }

  get atRiskGoalsCount(): number {
    return this.reportingFacade
      .energyGoals()
      .filter((goal) => this.getGoalInsight(goal).statusTone !== 'good').length;
  }

  get averageProgressPercentage(): number {
    const goals = this.reportingFacade.energyGoals();

    if (!goals.length) {
      return 0;
    }

    const totalProgress = goals.reduce(
      (total, goal) => total + this.getProgressPercentage(goal),
      0
    );

    return Number((totalProgress / goals.length).toFixed(1));
  }

  get projectedSavingsLabel(): string {
    const totalRemainingKilowattHours = this.reportingFacade
      .energyGoals()
      .reduce((total, goal) => {
        const insight = this.getGoalInsight(goal);
        return total + Math.max(0, goal.targetKilowattHours - insight.measuredKilowattHours);
      }, 0);

    return this.t('reporting.goals.availableKwh', {
      value: this.formatNumber(totalRemainingKilowattHours, 2),
    });
  }

  minDeadline(): string {
    return this.toInputDate(new Date());
  }

  getGoalInsight(goal: EnergyGoal): EnergyGoalInsight {
    const readings = this.getGoalReadings(goal);
    const measuredKilowattHours = readings.reduce(
      (total, reading) => total + reading.kilowattHours,
      0
    );
    const estimatedCost = readings.reduce(
      (total, reading) => total + reading.estimatedCost,
      0
    );
    const devicesMeasured = new Set(readings.map((reading) => reading.deviceId)).size;
    const expectedProgressPercentage = this.getExpectedProgressPercentage(goal);
    const projectedKilowattHours = this.getProjectedKilowattHours(goal, measuredKilowattHours);
    const progressPercentage = this.getProgressPercentage(goal, measuredKilowattHours);
    const daysRemaining = this.getDaysRemaining(goal.deadline);

    let statusLabel = this.t('reporting.goals.status.inControl');
    let statusTone: EnergyGoalInsight['statusTone'] = 'good';
    let recommendation = this.t('reporting.goals.recommendations.inControl');

    if (measuredKilowattHours > goal.targetKilowattHours || (daysRemaining <= 0 && progressPercentage > 100)) {
      statusLabel = this.t('reporting.goals.status.outOfGoal');
      statusTone = 'danger';
      recommendation = this.t('reporting.goals.recommendations.outOfGoal');
    } else if (projectedKilowattHours > goal.targetKilowattHours) {
      statusLabel = this.t('reporting.goals.status.atRisk');
      statusTone = 'warning';
      recommendation = this.t('reporting.goals.recommendations.atRisk');
    } else if (projectedKilowattHours <= goal.targetKilowattHours) {
      statusLabel = this.t('reporting.goals.status.goodPace');
      recommendation = this.t('reporting.goals.recommendations.goodPace');
    }

    if (!readings.length) {
      statusLabel = this.t('reporting.goals.status.noReadings');
      statusTone = 'warning';
      recommendation = this.t('reporting.goals.recommendations.noReadings');
    }

    return {
      measuredKilowattHours,
      estimatedCost,
      devicesMeasured,
      daysRemaining,
      expectedProgressPercentage,
      projectedKilowattHours,
      statusLabel,
      statusTone,
      recommendation,
    };
  }

  private getGoalReadings(goal: EnergyGoal): EnergyReading[] {
    const start = new Date(`${goal.createdAt || this.toInputDate(new Date())}T00:00:00`).getTime();
    const end = Math.min(
      new Date(`${goal.deadline}T23:59:59.999`).getTime(),
      Date.now()
    );

    return this.reportingFacade.energyReadings().filter((reading) => {
      const recordedAt = new Date(reading.recordedAt).getTime();
      return recordedAt >= start &&
        recordedAt <= end &&
        this.matchesGoalScope(reading, goal) &&
        this.matchesActiveWindow(reading, goal);
    });
  }

  private matchesActiveWindow(reading: EnergyReading, goal: EnergyGoal): boolean {
    if (!goal.activeFrom || !goal.activeTo) {
      return true;
    }

    const recordedTime = new Date(reading.recordedAt).toTimeString().slice(0, 5);

    if (goal.activeFrom === goal.activeTo) {
      return true;
    }

    if (goal.activeFrom < goal.activeTo) {
      return recordedTime >= goal.activeFrom && recordedTime < goal.activeTo;
    }

    return recordedTime >= goal.activeFrom || recordedTime < goal.activeTo;
  }

  private matchesGoalScope(reading: EnergyReading, goal: EnergyGoal): boolean {
    if (goal.scopeType === 'DEVICE') {
      return goal.scopeId === reading.deviceId;
    }

    if (goal.scopeType === 'GROUP') {
      const group = this.deviceControlFacade
        .deviceGroups()
        .find((item) => item.id === goal.scopeId);

      return group?.containsDevice(reading.deviceId) ?? false;
    }

    if (goal.scopeType === 'WORKPLACE') {
      return this.workplaceFacade
        .deviceAssignments()
        .some(
          (assignment) =>
            assignment.locationId === goal.scopeId &&
            assignment.deviceId === reading.deviceId
        );
    }

    if (goal.scopeType === 'ROOM') {
      return this.workplaceFacade
        .deviceAssignments()
        .some(
          (assignment) =>
            assignment.roomId === goal.scopeId &&
            assignment.deviceId === reading.deviceId
        );
    }

    return true;
  }

  private getProgressPercentage(goal: EnergyGoal, measuredKilowattHours?: number): number {
    if (goal.targetKilowattHours <= 0) {
      return 0;
    }

    const currentKilowattHours = measuredKilowattHours ?? this.getGoalInsight(goal).measuredKilowattHours;
    return Number(((currentKilowattHours / goal.targetKilowattHours) * 100).toFixed(1));
  }

  private getExpectedProgressPercentage(goal: EnergyGoal): number {
    const createdAt = new Date(`${goal.createdAt || this.toInputDate(new Date())}T00:00:00`);
    const deadline = new Date(`${goal.deadline}T23:59:59.999`);
    const now = new Date();
    const totalDuration = deadline.getTime() - createdAt.getTime();
    const elapsed = now.getTime() - createdAt.getTime();

    if (totalDuration <= 0) {
      return 100;
    }

    return Math.min(100, Math.max(0, Number(((elapsed / totalDuration) * 100).toFixed(1))));
  }

  private getProjectedKilowattHours(goal: EnergyGoal, measuredKilowattHours: number): number {
    const createdAt = new Date(`${goal.createdAt || this.toInputDate(new Date())}T00:00:00`);
    const deadline = new Date(`${goal.deadline}T23:59:59.999`);
    const now = new Date();
    const elapsedDays = Math.max(
      1,
      Math.ceil((now.getTime() - createdAt.getTime()) / 86_400_000)
    );
    const totalDays = Math.max(
      1,
      Math.ceil((deadline.getTime() - createdAt.getTime()) / 86_400_000)
    );

    return Number(((measuredKilowattHours / elapsedDays) * totalDays).toFixed(2));
  }

  private getDaysRemaining(deadline: string): number {
    const today = new Date();
    const end = new Date(`${deadline}T23:59:59.999`);

    return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));
  }

  private formatNumber(value: number, decimals = 2): string {
    return Number(value || 0).toLocaleString(this.currentLocale(), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private defaultScopeTargetId(scopeType: EnergyGoalScopeType): string {
    const activeLocationId = this.activeWorkplaceContext.activeLocationId();

    if (scopeType === 'WORKPLACE') {
      return String(activeLocationId ?? this.workplaceFacade.locations()[0]?.id ?? '');
    }

    if (scopeType === 'ROOM') {
      const room = activeLocationId
        ? this.workplaceFacade.rooms().find((item) => item.locationId === activeLocationId)
        : this.workplaceFacade.rooms()[0];

      return String(room?.id ?? '');
    }

    if (scopeType === 'DEVICE') {
      const activeDeviceIds = this.deviceIdsForLocation(activeLocationId);
      const device = activeLocationId
        ? this.deviceControlFacade.devices().find((item) => activeDeviceIds.has(item.id))
        : this.deviceControlFacade.devices()[0];

      return String(device?.id ?? '');
    }

    if (scopeType === 'GROUP') {
      const activeDeviceIds = this.deviceIdsForLocation(activeLocationId);
      const group = activeLocationId
        ? this.deviceControlFacade
            .deviceGroups()
            .find((item) => item.hasDevices && item.deviceIds.some((deviceId) => activeDeviceIds.has(deviceId)))
        : this.deviceControlFacade.deviceGroups().find((item) => item.hasDevices);

      return String(
        group?.id ?? ''
      );
    }

    return '';
  }

  private deviceIdsForLocation(locationId: number | null): Set<number> {
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

  private resolveScopeId(): number | null {
  if (this.scopeType === 'GENERAL') {
    return null;
  }

  const parsedId = Number(this.scopeTargetId);

  return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
}

private resolveScopeName(scopeId: number | null): string | null {
  if (this.scopeType === 'GENERAL' || !scopeId) {
    return this.t('reporting.goals.generalOperation');
  }

  if (this.scopeType === 'DEVICE') {
    return this.deviceControlFacade.getDeviceName(scopeId);
  }

  if (this.scopeType === 'WORKPLACE') {
    return this.workplaceFacade.getLocationName(scopeId);
  }

  if (this.scopeType === 'ROOM') {
    return this.workplaceFacade.getRoomName(scopeId);
  }

  if (this.scopeType === 'GROUP') {
    return this.deviceControlFacade
      .deviceGroups()
      .find((group) => group.id === scopeId)?.name ?? null;
  }

  return null;
}

private t(key: string, params?: Record<string, unknown>): string {
  this.uiPreferences.currentLanguage();

  return this.translate.instant(key, params);
}

private currentLocale(): string {
  const localeByLanguage = {
    es: 'es-PE',
    en: 'en-US',
    pt: 'pt-BR',
  };

  return localeByLanguage[this.uiPreferences.currentLanguage()];
}

private isPastDate(value: string): boolean {
  const selectedDate = new Date(`${value}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return selectedDate.getTime() < today.getTime();
}

private resetGoalForm(): void {
  this.title = '';
  this.targetKilowattHours = null;
  this.deadline = '';
  this.scopeType = 'WORKPLACE';
  this.scopeTargetId = this.defaultScopeTargetId(this.scopeType);
  this.activeFrom = '00:00';
  this.activeTo = '00:00';
}

}
