import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';

import { DeviceControlFacade } from '../../../../device-control/application/services/device-control.facade';
import { Device } from '../../../../device-control/domain/model/device.entity';
import { Routine } from '../../../../device-control/domain/model/routine.entity';
import { EnergyMonitoringFacade } from '../../../../energy-monitoring/application/services/energy-monitoring.facade';
import { NotificationsFacade } from '../../../../notifications/application/services/notifications.facade';
import { Alert } from '../../../../notifications/domain/model/alert.entity';
import { ReportingFacade } from '../../../../reporting/application/services/reporting.facade';
import { EnergyGoal } from '../../../../reporting/domain/model/energy-goal.entity';
import { ServiceManagementFacade } from '../../../../service-management/application/services/service-management.facade';
import { AppButtonComponent } from '../../components/app-button/app-button.component';
import { AppWheelSelectorComponent } from '../../components/app-wheel-selector/app-wheel-selector.component';
import { WheelOption, WheelOptionValue } from '../../components/app-wheel-selector/wheel-option.model';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { SectionCardComponent } from '../../components/section-card/section-card.component';
import { ActiveWorkplaceContextService } from '../../../../workplace/application/services/active-workplace-context.service';
import { WorkplaceFacade } from '../../../../workplace/application/services/workplace.facade';
import { DeviceAssignment } from '../../../../workplace/domain/model/device-assignment.entity';
import { Location, LocationType } from '../../../../workplace/domain/model/location.entity';
import { UiPreferencesService } from '../../../application/services/ui-preferences.service';

interface SetupStep {
  id: string;
  completed: boolean;
  titleKey: string;
  descriptionKey: string;
  actionLabelKey: string;
  actionLink: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    AppButtonComponent,
    AppWheelSelectorComponent,
    EmptyStateComponent,
    SectionCardComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent implements OnInit {
  readonly workplaceFacade = inject(WorkplaceFacade);
  readonly deviceControlFacade = inject(DeviceControlFacade);
  readonly energyMonitoringFacade = inject(EnergyMonitoringFacade);
  readonly reportingFacade = inject(ReportingFacade);
  readonly notificationsFacade = inject(NotificationsFacade);
  readonly serviceManagementFacade = inject(ServiceManagementFacade);
  readonly activeWorkplaceContext = inject(ActiveWorkplaceContextService);
  readonly uiPreferences = inject(UiPreferencesService);
  private readonly translate = inject(TranslateService);

  readonly activeLocation = this.activeWorkplaceContext.activeLocation;
  readonly activeLocationId = this.activeWorkplaceContext.activeLocationId;
  readonly activeLocationValue = computed(() => {
    const id = this.activeLocationId();
    return id ? String(id) : null;
  });
  readonly locationWheelOptions = computed<WheelOption[]>(() => {
    this.uiPreferences.currentLanguage();

    return this.workplaceFacade.locations().map((location) => ({
      label: location.name,
      value: String(location.id),
      sublabel: this.getLocationSubtitle(location),
    }));
  });

  readonly activeRooms = computed(() => {
    const activeId = this.activeLocationId();
    return activeId
      ? this.workplaceFacade.rooms().filter((room) => room.locationId === activeId)
      : [];
  });

  readonly activeAssignments = computed(() => {
    const activeId = this.activeLocationId();
    return activeId
      ? this.workplaceFacade
          .deviceAssignments()
          .filter((assignment) => assignment.locationId === activeId)
      : [];
  });

  readonly roomsWithDevicesCount = computed(() => {
    const roomIds = new Set(this.activeRooms().map((room) => room.id));
    const occupiedRoomIds = new Set(
      this.activeAssignments()
        .map((assignment) => assignment.roomId)
        .filter((roomId): roomId is number => roomId !== null && roomIds.has(roomId))
    );

    return occupiedRoomIds.size;
  });

  readonly roomsWithoutDevicesCount = computed(() =>
    Math.max(this.activeRooms().length - this.roomsWithDevicesCount(), 0)
  );

  readonly averageDevicesPerRoom = computed(() => {
    const roomIds = new Set(this.activeRooms().map((room) => room.id));
    const assignedToRooms = this.activeAssignments()
      .filter((assignment) => assignment.roomId !== null && roomIds.has(assignment.roomId))
      .length;

    return this.activeRooms().length === 0 ? 0 : assignedToRooms / this.activeRooms().length;
  });

  readonly assignedDeviceIds = computed(
    () => new Set(this.activeAssignments().map((assignment) => assignment.deviceId))
  );

  readonly activeDevices = computed(() => {
    const assignedIds = this.assignedDeviceIds();
    return this.deviceControlFacade
      .devices()
      .filter((device) => assignedIds.has(device.id));
  });

  readonly activeOnDevices = computed(() =>
    this.activeDevices().filter((device) => device.isOn)
  );

  readonly unassignedDevices = computed(() => {
    const allAssignedIds = new Set(
      this.workplaceFacade.deviceAssignments().map((assignment) => assignment.deviceId)
    );

    return this.deviceControlFacade
      .devices()
      .filter((device) => !allAssignedIds.has(device.id));
  });

  readonly activeGroups = computed(() => {
    const assignedIds = this.assignedDeviceIds();
    return this.deviceControlFacade
      .deviceGroups()
      .filter((group) => group.deviceIds.some((deviceId) => assignedIds.has(deviceId)));
  });

  readonly visibleGroups = computed(() => this.activeGroups().slice(0, 3));

  readonly hiddenGroupCount = computed(() =>
    Math.max(this.activeGroups().length - this.visibleGroups().length, 0)
  );

  readonly activeRoutines = computed(() => {
    const assignedIds = this.assignedDeviceIds();
    const roomIds = new Set(this.activeRooms().map((room) => room.id));
    const groupIds = new Set(this.activeGroups().map((group) => group.id));
    const activeId = this.activeLocationId();

    return this.deviceControlFacade
      .routines()
      .filter((routine) =>
        this.routineBelongsToActiveWorkplace(routine, assignedIds, roomIds, groupIds, activeId)
      );
  });

  readonly enabledRoutines = computed(() =>
    this.activeRoutines().filter((routine) => routine.enabled)
  );

  readonly visibleRoutines = computed(() => this.enabledRoutines().slice(0, 3));

  readonly hiddenRoutineCount = computed(() =>
    Math.max(this.enabledRoutines().length - this.visibleRoutines().length, 0)
  );

  readonly activeModes = computed(() => {
    const activeId = this.activeLocationId();
    return activeId
      ? this.deviceControlFacade
          .operationModes()
          .filter((mode) => mode.locationId === activeId)
      : [];
  });

  readonly activeMode = computed(
    () => this.activeModes().find((mode) => mode.status === 'ACTIVE') ?? null
  );

  readonly activeModeAffectedDeviceIds = computed(() => {
    const mode = this.activeMode();
    if (!mode) {
      return [];
    }

    return Array.from(new Set([
      ...mode.deviceIds,
      ...mode.turnOnDeviceIds,
      ...mode.turnOffDeviceIds,
      ...mode.keepOnDeviceIds,
    ]));
  });

  readonly activeGoals = computed(() => {
    const assignedIds = this.assignedDeviceIds();
    const roomIds = new Set(this.activeRooms().map((room) => room.id));
    const groupIds = new Set(this.activeGroups().map((group) => group.id));
    const activeId = this.activeLocationId();

    return this.reportingFacade
      .energyGoals()
      .filter((goal) => goal.isActive)
      .filter((goal) =>
        this.goalBelongsToActiveWorkplace(goal, assignedIds, roomIds, groupIds, activeId)
      );
  });

  readonly workplaceAlerts = computed(() => {
    const assignedIds = this.assignedDeviceIds();
    const roomIds = new Set(this.activeRooms().map((room) => room.id));
    const groupIds = new Set(this.activeGroups().map((group) => group.id));
    const activeId = this.activeLocationId();

    return this.notificationsFacade
      .sortedAlerts()
      .filter((alert) =>
        this.alertBelongsToActiveWorkplace(alert, assignedIds, roomIds, groupIds, activeId)
      )
      .slice(0, 5);
  });

  readonly criticalAlerts = computed(() =>
    this.workplaceAlerts().filter((alert) => alert.isCritical)
  );

  readonly workplaceReadings = computed(() => {
    const assignedIds = this.assignedDeviceIds();
    return this.energyMonitoringFacade
      .readings()
      .filter((reading) => assignedIds.has(reading.deviceId));
  });

  readonly currentWatts = computed(() =>
    this.activeDevices()
      .filter((device) => device.isOn)
      .reduce((total, device) => total + device.powerWatts, 0)
  );

  readonly todayKilowattHours = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.workplaceReadings()
      .filter((reading) => reading.recordedAt.slice(0, 10) === today)
      .reduce((total, reading) => total + reading.kilowattHours, 0);
  });

  readonly averageReadingWatts = computed(() => {
    const readings = this.workplaceReadings();
    if (readings.length === 0) {
      return 0;
    }

    return readings.reduce((total, reading) => total + reading.watts, 0) / readings.length;
  });

  readonly peakReadingWatts = computed(() =>
    Math.max(0, ...this.workplaceReadings().map((reading) => reading.watts))
  );

  readonly recentReports = computed(() =>
    this.reportingFacade.consumptionReports().slice(0, 3)
  );

  readonly maintenanceForActiveDevices = computed(() => {
    const assignedIds = this.assignedDeviceIds();
    return this.serviceManagementFacade
      .maintenanceTickets()
      .filter((ticket) => assignedIds.has(ticket.deviceId))
      .slice(0, 3);
  });

  readonly openSupportTickets = computed(() =>
    this.serviceManagementFacade
      .supportTickets()
      .filter((ticket) => ticket.isOpen || ticket.isInProgress)
  );

  readonly pendingMaintenanceForActiveDevices = computed(() => {
    const assignedIds = this.assignedDeviceIds();
    return this.serviceManagementFacade
      .maintenanceTickets()
      .filter((ticket) => assignedIds.has(ticket.deviceId))
      .filter((ticket) => ticket.isPending || ticket.isScheduled);
  });

  readonly loading = computed(
    () =>
      this.workplaceFacade.loading() ||
      this.deviceControlFacade.loading() ||
      this.energyMonitoringFacade.loading() ||
      this.reportingFacade.loading() ||
      this.notificationsFacade.loading() ||
      this.serviceManagementFacade.loading()
  );

  readonly setupSteps = computed<SetupStep[]>(() => {
    const availableDevices = this.deviceControlFacade
      .devices()
      .filter((device) => !device.isRemoved);
    const availableDeviceIds = new Set(availableDevices.map((device) => device.id));
    const assignmentsForAvailableDevices = this.workplaceFacade
      .deviceAssignments()
      .filter((assignment) => availableDeviceIds.has(assignment.deviceId));

    return [
      {
        id: 'site',
        completed: this.workplaceFacade.locations().length > 0,
        titleKey: 'home.setupGuide.steps.site.title',
        descriptionKey: 'home.setupGuide.steps.site.description',
        actionLabelKey: 'onboarding.createLocationAction',
        actionLink: '/spaces/sites',
      },
      {
        id: 'room',
        completed: this.workplaceFacade.rooms().length > 0,
        titleKey: 'home.setupGuide.steps.room.title',
        descriptionKey: 'home.setupGuide.steps.room.description',
        actionLabelKey: 'workplace.createRoom',
        actionLink: '/spaces/rooms',
      },
      {
        id: 'device',
        completed: availableDevices.length > 0,
        titleKey: 'home.setupGuide.steps.device.title',
        descriptionKey: 'home.setupGuide.steps.device.description',
        actionLabelKey: 'devices.connect',
        actionLink: '/operation/devices',
      },
      {
        id: 'assignment',
        completed: assignmentsForAvailableDevices.length > 0,
        titleKey: 'home.setupGuide.steps.assignment.title',
        descriptionKey: 'home.setupGuide.steps.assignment.description',
        actionLabelKey: 'nav.assignments',
        actionLink: '/spaces/assignments',
      },
      {
        id: 'routine',
        completed: this.deviceControlFacade.routines().some((routine) => routine.enabled),
        titleKey: 'home.setupGuide.steps.routine.title',
        descriptionKey: 'home.setupGuide.steps.routine.description',
        actionLabelKey: 'routines.addTitle',
        actionLink: '/operation/routines',
      },
    ];
  });

  readonly setupProgress = computed(() => {
    const steps = this.setupSteps();
    const completed = steps.filter((step) => step.completed).length;

    return {
      completed,
      total: steps.length,
      percent: steps.length === 0 ? 0 : Math.round((completed / steps.length) * 100),
    };
  });

  readonly setupGuideComplete = computed(() =>
    this.setupProgress().completed === this.setupProgress().total
  );

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.workplaceFacade.loadWorkplace(),
      this.deviceControlFacade.loadDeviceControl(),
      this.energyMonitoringFacade.loadReadings(),
      this.reportingFacade.loadReporting(),
      this.notificationsFacade.loadNotifications(),
      this.serviceManagementFacade.loadServiceManagement(),
    ]);

    this.activeWorkplaceContext.ensureActiveLocation(this.workplaceFacade.locations());
  }

  onActiveLocationChange(value: WheelOptionValue): void {
    this.activeWorkplaceContext.setActiveLocation(Number(value));
    this.activeWorkplaceContext.ensureActiveLocation(this.workplaceFacade.locations());
  }

  getLocationTypeLabel(location: Location): string {
    const labelKeys: Record<LocationType, string> = {
      HOME: 'home.locationTypes.home',
      BUSINESS: 'home.locationTypes.business',
      BRANCH: 'home.locationTypes.branch',
    };

    return this.translate.instant(labelKeys[location.type]);
  }

  getLocationSubtitle(location: Location): string {
    return this.getLocationTypeLabel(location);
  }

  getRoomName(assignment: DeviceAssignment): string {
    if (!assignment.roomId) {
      return this.translate.instant('home.noRoom');
    }

    return (
      this.activeRooms().find((room) => room.id === assignment.roomId)?.name ??
      this.translate.instant('home.roomNumber', { id: assignment.roomId })
    );
  }

  getDeviceName(deviceId: number): string {
    return this.deviceControlFacade.getDeviceName(deviceId);
  }

  getDeviceAssignment(device: Device): DeviceAssignment | null {
    return this.activeAssignments().find((assignment) => assignment.deviceId === device.id) ?? null;
  }

  deviceStatusLine(device: Device): string {
    const status = this.translate.instant(device.isOn ? 'home.deviceStatusOn' : 'home.deviceStatusOff');

    return `${status} - ${device.powerWatts} W`;
  }

  alertLevelLabel(level: Alert['level']): string {
    const labelKeys: Record<Alert['level'], string> = {
      SUCCESS: 'home.alertLevels.success',
      STABLE: 'home.alertLevels.stable',
      INFO: 'home.alertLevels.info',
      WARNING: 'home.alertLevels.warning',
      CRITICAL: 'home.alertLevels.critical',
    };

    return this.translate.instant(labelKeys[level]);
  }

  formatNumber(value: number, decimals = 2): string {
    const localeByLanguage = {
      es: 'es-PE',
      en: 'en-US',
      pt: 'pt-BR',
    };

    return Number(value || 0).toLocaleString(localeByLanguage[this.uiPreferences.currentLanguage()], {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  listFadeOpacity(visibleCount: number): string {
    return String(Math.max(0.14, 0.58 - Math.min(visibleCount, 3) * 0.14));
  }

  private routineBelongsToActiveWorkplace(
    routine: Routine,
    assignedIds: Set<number>,
    roomIds: Set<number>,
    groupIds: Set<number>,
    activeId: number | null
  ): boolean {
    if (!activeId) {
      return false;
    }

    if (routine.targetType === 'WORKPLACE') {
      return routine.targetId === activeId;
    }

    if (routine.targetType === 'ROOM') {
      return roomIds.has(routine.targetId);
    }

    if (routine.targetType === 'GROUP') {
      return Boolean(routine.groupId && groupIds.has(routine.groupId)) || groupIds.has(routine.targetId);
    }

    return Boolean(routine.deviceId && assignedIds.has(routine.deviceId)) || assignedIds.has(routine.targetId);
  }

  private goalBelongsToActiveWorkplace(
    goal: EnergyGoal,
    assignedIds: Set<number>,
    roomIds: Set<number>,
    groupIds: Set<number>,
    activeId: number | null
  ): boolean {
    if (!activeId) {
      return false;
    }

    if (goal.scopeType === 'GENERAL') {
      return true;
    }

    if (goal.scopeType === 'WORKPLACE') {
      return goal.scopeId === activeId;
    }

    if (goal.scopeType === 'ROOM') {
      return Boolean(goal.scopeId && roomIds.has(goal.scopeId));
    }

    if (goal.scopeType === 'GROUP') {
      return Boolean(goal.scopeId && groupIds.has(goal.scopeId));
    }

    return Boolean(goal.scopeId && assignedIds.has(goal.scopeId));
  }

  private alertBelongsToActiveWorkplace(
    alert: Alert,
    assignedIds: Set<number>,
    roomIds: Set<number>,
    groupIds: Set<number>,
    activeId: number | null
  ): boolean {
    if (!activeId) {
      return false;
    }

    if (alert.sourceType === 'WORKPLACE') {
      return alert.sourceId === String(activeId);
    }

    if (alert.sourceType === 'ROOM') {
      return alert.sourceId !== null && roomIds.has(Number(alert.sourceId));
    }

    if (alert.sourceType === 'DEVICE') {
      return alert.sourceId !== null && assignedIds.has(Number(alert.sourceId));
    }

    if (alert.sourceType === 'GROUP') {
      return alert.sourceId !== null && groupIds.has(Number(alert.sourceId));
    }

    return ['SYSTEM', 'RULE', 'MODE', 'GOAL', 'REPORT', 'ROUTINE'].includes(alert.sourceType);
  }
}
