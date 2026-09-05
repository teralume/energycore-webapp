import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';

import { EnergyMonitoringFacade } from '../../../application/services/energy-monitoring.facade';
import { EnergyReading } from '../../../domain/model/energy-reading.entity';

import { ToastService } from '../../../../shared/application/services/toast.service';
import { ActiveWorkplaceContextService } from '../../../../workplace/application/services/active-workplace-context.service';
import { WorkplaceFacade } from '../../../../workplace/application/services/workplace.facade';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { AppNumberStepperComponent } from '../../../../shared/presentation/components/app-number-stepper/app-number-stepper.component';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';
import {
  EnergyTrendChartComponent,
  EnergyTrendChartItem,
} from '../../components/energy-trend-chart/energy-trend-chart.component';
import { LucideActivity, LucideDownload, LucideGauge } from '@lucide/angular';

type ConsumptionPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface ConsumptionChartPoint {
  key: string;
  deviceId: number;
  deviceName: string;
  deviceEmoji: string;
  recordedAt: Date;
  watts: number;
  kilowattHours: number;
  estimatedCost: number;
  sampleSeconds: number;
  percentage: number;
  isHigh: boolean;
}

interface ConsumptionChartSummary {
  readings: number;
  devices: number;
  totalKilowattHours: number;
  estimatedCost: number;
  averageWatts: number;
  peakWatts: number;
  totalSeconds: number;
}

interface MetricCard {
  label: string;
  value: string;
  hint: string;
  tone: 'accent' | 'plain' | 'warning';
}

@Component({
  selector: 'app-energy-dashboard-page',
  standalone: true,
  imports: [
    TranslateModule,
    AppButtonComponent,
    AppDropdownComponent,
    AppNumberStepperComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    SectionCardComponent,
    EnergyTrendChartComponent,
    LucideActivity,
    LucideDownload,
    LucideGauge,
  ],
  templateUrl: './energy-dashboard-page.component.html',
  styleUrls: ['./energy-dashboard-page.component.scss'],
})
export class EnergyDashboardPageComponent implements OnInit, OnDestroy {
  readonly energyMonitoringFacade = inject(EnergyMonitoringFacade);
  private readonly activeWorkplaceContext = inject(ActiveWorkplaceContextService);
  private readonly workplaceFacade = inject(WorkplaceFacade);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly uiPreferences = inject(UiPreferencesService);

  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly maxSegmentsPerReading = 24;
  private readonly maxChartReadings = 220;
  private readonly maxChartPoints = 360;

  readonly sampleSeconds = signal(15);
  readonly selectedPeriod = signal<ConsumptionPeriod>('DAILY');

  readonly periodOptions: DropdownOption[] = [
    {
      label: 'Diario',
      labelKey: 'energyDashboard.periods.daily',
      value: 'DAILY',
      description: 'Lecturas reales registradas hoy.',
      descriptionKey: 'energyDashboard.periodDescriptions.daily',
    },
    {
      label: 'Semanal',
      labelKey: 'energyDashboard.periods.weekly',
      value: 'WEEKLY',
      description: 'Lecturas reales de los ultimos 7 dias.',
      descriptionKey: 'energyDashboard.periodDescriptions.weekly',
    },
    {
      label: 'Mensual',
      labelKey: 'energyDashboard.periods.monthly',
      value: 'MONTHLY',
      description: 'Lecturas reales del mes actual.',
      descriptionKey: 'energyDashboard.periodDescriptions.monthly',
    },
  ];

  readonly activeLocationId = computed(() => this.activeWorkplaceContext.activeLocationId());
  readonly activeLocation = computed(() => this.activeWorkplaceContext.activeLocation());
  readonly activeLocationDeviceIds = computed(() => {
    const activeLocationId = this.activeLocationId();

    if (!activeLocationId) {
      return new Set<number>();
    }

    const assignedDeviceIds = new Set(
      this.workplaceFacade
        .getCurrentDeviceAssignmentsForLocation(activeLocationId)
        .map((assignment) => assignment.deviceId),
    );

    if (assignedDeviceIds.size > 0) {
      return assignedDeviceIds;
    }

    return this.energyDeviceIdsFallback();
  });

  readonly allReadings = computed(() => this.energyMonitoringFacade.readings() ?? []);

  readonly readings = computed(() => {
    const activeLocationId = this.activeLocationId();

    if (!activeLocationId) {
      return [];
    }

    const activeDeviceIds = this.activeLocationDeviceIds();

    return this.allReadings().filter((reading) => activeDeviceIds.has(reading.deviceId));
  });

  readonly summary = computed(() => this.energyMonitoringFacade.dashboardSummary());
  readonly totalReadings = computed(() => this.readings().length);
  readonly todayReadings = computed(() => {
    const range = this.periodRange('DAILY');

    return this.readings().filter((reading) => {
      const timestamp = this.toTimestamp(reading.recordedAt);
      return timestamp >= range.start && timestamp <= range.end;
    });
  });
  readonly currentMonthReadings = computed(() => {
    const range = this.periodRange('MONTHLY');

    return this.readings().filter((reading) => {
      const timestamp = this.toTimestamp(reading.recordedAt);
      return timestamp >= range.start && timestamp <= range.end;
    });
  });
  readonly currentWatts = computed(() =>
    this.activeDeviceDetails().reduce((total, device) => total + device.watts, 0),
  );
  readonly todayKilowattHours = computed(() =>
    this.todayReadings().reduce((total, reading) => total + reading.kilowattHours, 0),
  );
  readonly todayEstimatedCost = computed(() =>
    this.todayReadings().reduce((total, reading) => total + reading.estimatedCost, 0),
  );
  readonly projectedMonthlyCost = computed(() => {
    const now = new Date();
    const elapsedDays = Math.max(1, now.getDate());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthCost = this.currentMonthReadings().reduce(
      (total, reading) => total + reading.estimatedCost,
      0,
    );

    return monthCost > 0 ? (monthCost / elapsedDays) * daysInMonth : 0;
  });
  readonly costPerHour = computed(() =>
    this.activeDeviceDetails().reduce((total, device) => total + device.costPerHour, 0),
  );
  readonly activeDevicesCount = computed(() => this.activeDeviceDetails().length);
  readonly monitoredDevicesCount = computed(() => this.activeLocationDeviceIds().size);
  readonly normalReadingsCount = computed(
    () => this.readings().filter((reading) => reading.isNormal).length,
  );
  readonly highReadingsCount = computed(
    () => this.readings().filter((reading) => reading.isHigh).length,
  );
  readonly efficiencyScore = computed(() => {
    const readings = this.readings();

    if (readings.length === 0) {
      return 100;
    }

    return Math.max(0, Math.round(100 - (this.highReadingsCount() / readings.length) * 100));
  });
  readonly operationalStatus = computed(() => {
    const score = this.efficiencyScore();

    if (score < 70) {
      return this.t('energyDashboard.operationalStatus.review');
    }

    if (score < 90) {
      return this.t('energyDashboard.operationalStatus.attention');
    }

    return this.t('energyDashboard.operationalStatus.optimal');
  });
  readonly activeAlertsCount = computed(() => this.highReadingsCount());
  readonly criticalAlertsCount = computed(() => this.highReadingsCount());
  readonly latestAlertLevel = computed(() => (this.highReadingsCount() > 0 ? 'HIGH' : 'STABLE'));
  readonly latestAlertLevelLabel = computed(() =>
    this.readingStatusLabelByLevel(this.latestAlertLevel()),
  );
  readonly latestAlertTitle = computed(() => {
    const latestHighReading = this.recentAlerts()[0];

    return latestHighReading
      ? this.t('energyDashboard.highConsumptionRegistered', {
          device: latestHighReading.deviceName,
        })
      : this.t('energyDashboard.noActiveAlerts');
  });

  readonly dashboardRecommendation = computed(() => {
    const activeLocation = this.activeLocation();

    if (!activeLocation) {
      return this.t('energyDashboard.selectActiveSiteRecommendation');
    }

    if (this.readings().length === 0) {
      return this.t('energyDashboard.noReadingsForSiteRecommendation', {
        site: activeLocation.name,
      });
    }

    if (this.highReadingsCount() > 0) {
      return this.t('energyDashboard.highReadingsForSiteRecommendation', {
        site: activeLocation.name,
      });
    }

    return this.t('energyDashboard.stableConsumptionRecommendation', {
      site: activeLocation.name,
    });
  });

  readonly chartTitle = computed(() => {
    const titles: Record<ConsumptionPeriod, string> = {
      DAILY: 'energyDashboard.chartTitles.daily',
      WEEKLY: 'energyDashboard.chartTitles.weekly',
      MONTHLY: 'energyDashboard.chartTitles.monthly',
    };

    return this.t(titles[this.selectedPeriod()]);
  });

  readonly chartSubtitle = computed(() => {
    const subtitles: Record<ConsumptionPeriod, string> = {
      DAILY: 'energyDashboard.chartSubtitles.daily',
      WEEKLY: 'energyDashboard.chartSubtitles.weekly',
      MONTHLY: 'energyDashboard.chartSubtitles.monthly',
    };

    return this.t(subtitles[this.selectedPeriod()]);
  });

  readonly chartReadings = computed(() => {
    const range = this.periodRange(this.selectedPeriod());

    return [...this.readings()]
      .filter((reading) => {
        const timestamp = this.toTimestamp(reading.recordedAt);
        return timestamp >= range.start && timestamp <= range.end;
      })
      .sort(
        (first, second) => this.toTimestamp(first.recordedAt) - this.toTimestamp(second.recordedAt),
      );
  });

  readonly chartVisualReadings = computed(() => {
    const readings = this.chartReadings();

    if (readings.length <= this.maxChartReadings) {
      return readings;
    }

    return readings.slice(readings.length - this.maxChartReadings);
  });

  readonly consumptionChart = computed<ConsumptionChartPoint[]>(() => {
    const readings = this.chartVisualReadings();
    const rawPoints = readings
      .flatMap((reading, index) => this.toConsumptionChartPoints(reading, index, readings.length))
      .sort((first, second) => first.recordedAt.getTime() - second.recordedAt.getTime());
    const visiblePoints =
      rawPoints.length > this.maxChartPoints
        ? rawPoints.slice(rawPoints.length - this.maxChartPoints)
        : rawPoints;

    const maxKilowattHours = visiblePoints.reduce(
      (max, point) => Math.max(max, point.kilowattHours),
      0.000001,
    );

    return visiblePoints.map((point) => ({
      ...point,
      percentage: Math.max(8, Math.round((point.kilowattHours / maxKilowattHours) * 100)),
    }));
  });

  readonly consumptionTrendItems = computed<EnergyTrendChartItem[]>(() =>
    this.consumptionChart().map((point) => ({
      key: point.key,
      value: point.kilowattHours,
      valueLabel: this.formatEnergy(point.kilowattHours),
      caption: this.formatDuration(point.sampleSeconds),
      tone: point.isHigh ? 'warning' : 'default',
      title: point.deviceName,
      subtitle: `${this.formatNumber(point.watts, 0)} W`,
      detail: this.formatDateTime(point.recordedAt),
      ariaLabel: this.t('energyDashboard.chartItemAria', {
        energy: this.formatEnergy(point.kilowattHours),
        emoji: '',
        device: point.deviceName,
        watts: this.formatNumber(point.watts, 0),
        date: this.formatDateTime(point.recordedAt),
        duration: this.formatDuration(point.sampleSeconds),
      }),
    })),
  );

  readonly chartSummary = computed<ConsumptionChartSummary>(() => {
    const readings = this.chartReadings();
    const totalKilowattHours = readings.reduce(
      (total, reading) => total + reading.kilowattHours,
      0,
    );
    const estimatedCost = readings.reduce((total, reading) => total + reading.estimatedCost, 0);
    const totalWatts = readings.reduce((total, reading) => total + reading.watts, 0);
    const peakWatts = readings.reduce((peak, reading) => Math.max(peak, reading.watts), 0);
    const totalSeconds = readings.reduce((total, reading) => total + reading.sampleSeconds, 0);

    return {
      readings: readings.length,
      devices: new Set(readings.map((reading) => reading.deviceId)).size,
      totalKilowattHours,
      estimatedCost,
      averageWatts: readings.length ? totalWatts / readings.length : 0,
      peakWatts,
      totalSeconds,
    };
  });

  readonly metricCards = computed<MetricCard[]>(() => [
    {
      label: this.t('energyDashboard.metrics.activePower'),
      value: `${this.formatNumber(this.currentWatts())} W`,
      hint: this.t('energyDashboard.metricHints.activePower'),
      tone: 'accent',
    },
    {
      label: this.t('energyDashboard.metrics.energyToday'),
      value: this.formatEnergy(this.todayKilowattHours()),
      hint: this.t('energyDashboard.metricHints.energyToday'),
      tone: 'plain',
    },
    {
      label: this.t('energyDashboard.metrics.costToday'),
      value: `S/ ${this.formatNumber(this.todayEstimatedCost())}`,
      hint: this.t('energyDashboard.metricHints.costToday'),
      tone: 'plain',
    },
    {
      label: this.t('energyDashboard.metrics.costPerHour'),
      value: `S/ ${this.formatNumber(this.costPerHour())}`,
      hint: this.t('energyDashboard.metricHints.costPerHour'),
      tone: 'plain',
    },
    {
      label: this.t('energyDashboard.metrics.monthlyProjection'),
      value: `S/ ${this.formatNumber(this.projectedMonthlyCost())}`,
      hint: this.t('energyDashboard.metricHints.monthlyProjection'),
      tone: 'plain',
    },
    {
      label: this.t('energyDashboard.metrics.activeAlerts'),
      value: `${this.activeAlertsCount()}`,
      hint: this.t('energyDashboard.metricHints.activeAlerts', {
        count: this.criticalAlertsCount(),
        level: this.latestAlertLevelLabel(),
        title: this.latestAlertTitle(),
      }),
      tone: this.activeAlertsCount() > 0 ? 'warning' : 'plain',
    },
  ]);

  readonly activeDeviceDetails = computed(() => {
    const activeDeviceIds = this.activeLocationDeviceIds();

    return (this.summary()?.activeDeviceDetails ?? []).filter((device) =>
      activeDeviceIds.has(device.deviceId),
    );
  });
  readonly visibleActiveDeviceDetails = computed(() => this.activeDeviceDetails().slice(0, 2));
  readonly hiddenActiveDeviceDetailsCount = computed(() =>
    Math.max(0, this.activeDeviceDetails().length - this.visibleActiveDeviceDetails().length),
  );
  readonly topDevices = computed(() => {
    const byDevice = new Map<
      number,
      {
        deviceId: number;
        name: string;
        room: string;
        type: string;
        watts: number;
        kilowattHours: number;
        estimatedCost: number;
        readings: number;
        highReadings: number;
      }
    >();

    for (const reading of this.readings()) {
      const current = byDevice.get(reading.deviceId) ?? {
        deviceId: reading.deviceId,
        name: reading.deviceName,
        room: this.getRoomNameForDevice(reading.deviceId),
        type: this.getDeviceTypeForDevice(reading.deviceId),
        watts: 0,
        kilowattHours: 0,
        estimatedCost: 0,
        readings: 0,
        highReadings: 0,
      };

      current.watts = Math.max(current.watts, reading.watts);
      current.kilowattHours += reading.kilowattHours;
      current.estimatedCost += reading.estimatedCost;
      current.readings += 1;
      current.highReadings += reading.isHigh ? 1 : 0;
      byDevice.set(reading.deviceId, current);
    }

    return [...byDevice.values()].sort(
      (first, second) => second.kilowattHours - first.kilowattHours,
    );
  });
  readonly visibleTopDevices = computed(() => this.topDevices().slice(0, 3));
  readonly hiddenTopDevicesCount = computed(() =>
    Math.max(0, this.topDevices().length - this.visibleTopDevices().length),
  );
  readonly roomConsumption = computed(() => {
    const byRoom = new Map<
      string,
      {
        room: string;
        watts: number;
        kilowattHours: number;
        estimatedCost: number;
        deviceIds: Set<number>;
      }
    >();

    for (const reading of this.readings()) {
      const room = this.getRoomNameForDevice(reading.deviceId);
      const current = byRoom.get(room) ?? {
        room,
        watts: 0,
        kilowattHours: 0,
        estimatedCost: 0,
        deviceIds: new Set<number>(),
      };

      current.watts = Math.max(current.watts, reading.watts);
      current.kilowattHours += reading.kilowattHours;
      current.estimatedCost += reading.estimatedCost;
      current.deviceIds.add(reading.deviceId);
      byRoom.set(room, current);
    }

    return [...byRoom.values()]
      .map((room) => ({
        room: room.room,
        watts: room.watts,
        kilowattHours: room.kilowattHours,
        estimatedCost: room.estimatedCost,
        activeDevices: room.deviceIds.size,
      }))
      .sort((first, second) => second.kilowattHours - first.kilowattHours);
  });
  readonly visibleRoomConsumption = computed(() => this.roomConsumption().slice(0, 2));
  readonly hiddenRoomConsumptionCount = computed(() =>
    Math.max(0, this.roomConsumption().length - this.visibleRoomConsumption().length),
  );
  readonly deviceTypeById = computed(() => {
    const map = new Map<number, string>();

    for (const device of this.activeDeviceDetails()) {
      map.set(device.deviceId, device.type);
    }

    for (const device of this.topDevices()) {
      if (!map.has(device.deviceId)) {
        map.set(device.deviceId, device.type);
      }
    }

    return map;
  });

  readonly recentAlerts = computed(() =>
    [...this.readings()]
      .filter((reading) => reading.isHigh)
      .sort(
        (first, second) => this.toTimestamp(second.recordedAt) - this.toTimestamp(first.recordedAt),
      ),
  );
  readonly visibleRecentAlerts = computed(() => this.recentAlerts().slice(0, 2));
  readonly hiddenRecentAlertsCount = computed(() =>
    Math.max(0, this.recentAlerts().length - this.visibleRecentAlerts().length),
  );

  readonly latestReadings = computed(() =>
    [...this.readings()].sort(
      (first, second) => this.toTimestamp(second.recordedAt) - this.toTimestamp(first.recordedAt),
    ),
  );
  readonly visibleLatestReadings = computed(() => this.latestReadings().slice(0, 4));
  readonly hiddenLatestReadingsCount = computed(() =>
    Math.max(0, this.latestReadings().length - this.visibleLatestReadings().length),
  );

  async ngOnInit(): Promise<void> {
    const workplaceAlreadyLoaded =
      this.workplaceFacade.locations().length > 0 ||
      this.workplaceFacade.rooms().length > 0 ||
      this.workplaceFacade.deviceAssignments().length > 0;
    const readingsAlreadyLoaded = this.energyMonitoringFacade.readings().length > 0;

    await this.loadSamplingSettings();

    if (!workplaceAlreadyLoaded) {
      await this.workplaceFacade.loadWorkplace();
    }

    this.activeWorkplaceContext.ensureActiveLocation(this.workplaceFacade.locations());

    if (readingsAlreadyLoaded) {
      void this.energyMonitoringFacade.loadReadings(false);
    } else {
      await this.energyMonitoringFacade.loadReadings();
    }

    if (this.energyMonitoringFacade.error()) {
      this.toastService.error(this.t('energyDashboard.toasts.loadError'));
    }

    this.restartAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
  }

  onPeriodChange(value: string): void {
    if (!this.isConsumptionPeriod(value) || value === this.selectedPeriod()) {
      return;
    }

    this.selectedPeriod.set(value);
  }

  exportCsv(): void {
    const exported = this.energyMonitoringFacade.exportCsv({
      readings: this.readings(),
      fileName: 'energycore-energy-dashboard',
    });

    if (exported) {
      this.toastService.success(this.t('energyDashboard.toasts.exportSuccess'));
      return;
    }

    this.toastService.warning(this.t('energyDashboard.toasts.exportError'));
  }

  async saveSamplingSeconds(): Promise<void> {
    try {
      const nextValue = Math.max(5, Math.min(3600, Number(this.sampleSeconds())));
      const savedValue = await this.energyMonitoringFacade.updateSamplingSeconds(nextValue);

      this.sampleSeconds.set(savedValue);
      this.restartAutoRefresh();

      this.toastService.success(
        this.t('energyDashboard.toasts.intervalUpdated', { seconds: savedValue }),
      );
    } catch (error) {
      console.error(error);
      this.toastService.error(this.t('energyDashboard.toasts.intervalUpdateError'));
    }
  }

  onSampleSecondsChange(value: number | null): void {
    const nextValue = Math.max(5, Math.min(3600, value ?? 5));

    this.sampleSeconds.set(nextValue);
  }

  formatDateTime(value: string | Date): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return typeof value === 'string' ? value : '';
    }

    return new Intl.DateTimeFormat(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  formatNumber(value: number, digits = 2): string {
    return new Intl.NumberFormat(this.currentLocale(), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  }

  listFadeOpacity(visibleCount: number): string {
    return String(Math.max(0.14, 0.58 - Math.min(visibleCount, 4) * 0.11));
  }

  rankingPercentage(kilowattHours: number): number {
    const maximum = this.topDevices()[0]?.kilowattHours ?? 0;

    return maximum > 0 ? Math.max(6, (kilowattHours / maximum) * 100) : 0;
  }

  formatEnergy(value: number): string {
    if (value < 0.001) {
      return `${this.formatNumber(value * 1000, 2)} Wh`;
    }

    return `${this.formatNumber(value, 3)} kWh`;
  }

  formatMoney(value: number): string {
    return this.formatNumber(value < 0.01 ? value : Number(value.toFixed(2)), value < 0.01 ? 4 : 2);
  }

  formatDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m`;
    }

    return `${seconds}s`;
  }

  getDeviceEmoji(deviceId: number, deviceName: string): string {
    const deviceType = this.deviceTypeById().get(deviceId);

    if (deviceType) {
      return this.getDeviceEmojiByType(deviceType);
    }

    return this.getDeviceEmojiByName(deviceName);
  }

  readingStatusLabel(reading: EnergyReading): string {
    return this.readingStatusLabelByLevel(reading.isHigh ? 'HIGH' : 'STABLE');
  }

  private readingStatusLabelByLevel(level: 'HIGH' | 'STABLE'): string {
    return this.t(
      level === 'HIGH'
        ? 'energyDashboard.readingStatuses.high'
        : 'energyDashboard.readingStatuses.normal',
    );
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

  private getRoomNameForDevice(deviceId: number): string {
    const activeLocationId = this.activeLocationId();
    const assignments = activeLocationId
      ? this.workplaceFacade.getCurrentDeviceAssignmentsForLocation(activeLocationId)
      : this.workplaceFacade.currentDeviceAssignments;
    const assignment = assignments.find((item) => item.deviceId === deviceId);

    return assignment
      ? this.workplaceFacade.getRoomName(assignment.roomId)
      : this.t('energyDashboard.noRoom');
  }

  private energyDeviceIdsFallback(): Set<number> {
    const summary = this.summary();

    return new Set([
      ...this.energyMonitoringFacade.readings().map((reading) => reading.deviceId),
      ...(summary?.activeDeviceDetails.map((device) => device.deviceId) ?? []),
      ...(summary?.topDevices.map((device) => device.deviceId) ?? []),
    ]);
  }

  private getDeviceTypeForDevice(deviceId: number): string {
    const summary = this.summary();
    const device =
      summary?.activeDeviceDetails.find((item) => item.deviceId === deviceId) ??
      summary?.topDevices.find((item) => item.deviceId === deviceId);

    return device?.type ?? 'OTHER';
  }

  private async loadSamplingSettings(): Promise<void> {
    try {
      this.sampleSeconds.set(await this.energyMonitoringFacade.loadSamplingSeconds());
    } catch (error) {
      console.error(error);
      this.toastService.warning(this.t('energyDashboard.toasts.samplingLoadFallback'));
    }
  }

  private restartAutoRefresh(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }

    this.refreshIntervalId = setInterval(async () => {
      await this.energyMonitoringFacade.loadReadings(false);

      if (this.energyMonitoringFacade.error()) {
        this.toastService.error(this.t('energyDashboard.toasts.refreshError'));
      }
    }, this.sampleSeconds() * 1000);
  }

  private periodRange(period: ConsumptionPeriod): { start: number; end: number } {
    const now = new Date();
    const start = new Date(now);

    if (period === 'DAILY') {
      start.setHours(0, 0, 0, 0);
      return { start: start.getTime(), end: now.getTime() };
    }

    if (period === 'WEEKLY') {
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start: start.getTime(), end: now.getTime() };
    }

    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start: start.getTime(), end: now.getTime() };
  }

  private toTimestamp(value: string): number {
    const time = new Date(value).getTime();

    return Number.isNaN(time) ? 0 : time;
  }

  private isConsumptionPeriod(value: string): value is ConsumptionPeriod {
    return ['DAILY', 'WEEKLY', 'MONTHLY'].includes(value);
  }

  private toConsumptionChartPoints(
    reading: EnergyReading,
    readingIndex: number,
    readingsCount: number,
  ): ConsumptionChartPoint[] {
    const recordedAt = new Date(reading.recordedAt);

    if (Number.isNaN(recordedAt.getTime())) {
      return [];
    }

    const totalSeconds = Math.max(0, Number(reading.sampleSeconds ?? 0));
    const configuredSeconds = Math.max(5, Number(this.sampleSeconds() || 15));
    const visualSegmentSeconds = Math.min(configuredSeconds, 15);
    const maxSegmentsForReading = this.maxSegmentsForVisibleReading(readingsCount);
    const sparseMinimumSegments =
      readingsCount <= 1 && totalSeconds >= 5 ? 7 : readingsCount <= 2 && totalSeconds >= 5 ? 4 : 1;
    const measuredSegmentCount =
      totalSeconds > visualSegmentSeconds
        ? Math.min(Math.ceil(totalSeconds / visualSegmentSeconds), maxSegmentsForReading)
        : 1;
    const segmentCount = Math.min(
      Math.max(measuredSegmentCount, sparseMinimumSegments),
      maxSegmentsForReading,
    );
    const segmentSeconds = segmentCount > 1 ? totalSeconds / segmentCount : totalSeconds;
    const segmentRatio = totalSeconds > 0 && segmentCount > 1 ? segmentSeconds / totalSeconds : 1;
    const kilowattHours = Number(reading.kilowattHours ?? 0);
    const estimatedCost = Number(reading.estimatedCost ?? 0);

    return Array.from({ length: segmentCount }, (_, segmentIndex) => {
      const segmentOffset = segmentCount - segmentIndex - 1;
      const segmentRecordedAt =
        segmentCount > 1
          ? new Date(recordedAt.getTime() - segmentOffset * segmentSeconds * 1000)
          : recordedAt;

      return {
        key: `${reading.id}-${reading.deviceId}-${recordedAt.getTime()}-${readingIndex}-${segmentIndex}`,
        deviceId: reading.deviceId,
        deviceName: reading.deviceName,
        deviceEmoji: this.getDeviceEmoji(reading.deviceId, reading.deviceName),
        recordedAt: segmentRecordedAt,
        watts: Number(reading.watts ?? 0),
        kilowattHours: kilowattHours * segmentRatio,
        estimatedCost: estimatedCost * segmentRatio,
        sampleSeconds: Math.round(segmentSeconds),
        percentage: 0,
        isHigh: reading.isHigh === true || reading.status === 'HIGH',
      };
    });
  }

  private maxSegmentsForVisibleReading(readingsCount: number): number {
    if (readingsCount > 160) {
      return 1;
    }

    if (readingsCount > 80) {
      return 2;
    }

    if (readingsCount > 40) {
      return 3;
    }

    if (readingsCount > 20) {
      return 6;
    }

    return this.maxSegmentsPerReading;
  }

  private getDeviceEmojiByType(type: string): string {
    const icons: Record<string, string> = {
      PLUG: '🔌',
      LIGHT: '💡',
      SWITCH: '🔘',
      SENSOR: '📡',
      OTHER: '⚡',
    };

    return icons[type] ?? this.getDeviceEmojiByName(type);
  }

  private getDeviceEmojiByName(value: string): string {
    const normalized = this.normalizeText(value);

    if (
      normalized.includes('luz') ||
      normalized.includes('lampara') ||
      normalized.includes('foco') ||
      normalized.includes('bombilla') ||
      normalized.includes('led')
    ) {
      return '💡';
    }

    if (
      normalized.includes('enchufe') ||
      normalized.includes('plug') ||
      normalized.includes('tomacorriente') ||
      normalized.includes('socket')
    ) {
      return '🔌';
    }

    if (
      normalized.includes('sensor') ||
      normalized.includes('movimiento') ||
      normalized.includes('temperatura') ||
      normalized.includes('humedad') ||
      normalized.includes('presencia')
    ) {
      return '📡';
    }

    if (
      normalized.includes('switch') ||
      normalized.includes('interruptor') ||
      normalized.includes('rele') ||
      normalized.includes('relay')
    ) {
      return '🔘';
    }

    if (
      normalized.includes('tv') ||
      normalized.includes('televisor') ||
      normalized.includes('television') ||
      normalized.includes('pantalla')
    ) {
      return '📺';
    }

    if (
      normalized.includes('micro') ||
      normalized.includes('horno') ||
      normalized.includes('cocina')
    ) {
      return '🍳';
    }

    if (
      normalized.includes('frigo') ||
      normalized.includes('nevera') ||
      normalized.includes('refriger') ||
      normalized.includes('congel')
    ) {
      return '❄️';
    }

    if (
      normalized.includes('aire') ||
      normalized.includes('acondicion') ||
      normalized.includes('clima') ||
      normalized.includes('climat')
    ) {
      return '🌀';
    }

    return '⚡';
  }

  private normalizeText(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
