import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { BillingFacade } from '../../../billing/application/services/billing.facade';
import { PlanPermissionService } from '../../../billing/domain/services/plan-permission.service';

import { ExportEnergyReadingsCommand } from '../commands/export-energy-readings.command';
import { EnergyReadingsFilterCriteria } from '../criteria/energy-readings-filter.criteria';

import { EnergyReadingsApiService } from '../../infrastructure/api/energy-readings-api.service';
import { EnergyReadingAssembler } from '../../infrastructure/assemblers/energy-reading.assembler';

import { EnergyMonitoringStore } from '../stores/energy-monitoring.store';

@Injectable({
  providedIn: 'root',
})
export class EnergyMonitoringFacade {
  private readonly energyReadingAssembler = new EnergyReadingAssembler();

  private toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

  get readings() {
    return this.store.readings;
  }

  get filteredReadings() {
    return this.store.filteredReadings;
  }

  get visibleReadings() {
    return this.store.visibleReadings;
  }

  get dashboardSummary() {
    return this.store.dashboardSummary;
  }

  get loading() {
    return this.store.loading;
  }

  get error() {
    return this.store.error;
  }

  get totalWatts() {
    return this.store.totalWatts;
  }

  get averageWatts() {
    return this.store.averageWatts;
  }

  get highestReading() {
    return this.store.highestReading;
  }

  get highReadingsCount() {
    return this.store.highReadingsCount;
  }

  get normalReadingsCount() {
    return this.store.normalReadingsCount;
  }

  get recommendationKey() {
    return this.store.recommendationKey;
  }

  get groupedByDevice() {
    return this.store.groupedByDevice;
  }

  constructor(
    private readonly energyReadingsApi: EnergyReadingsApiService,
    private readonly billingFacade: BillingFacade,
    private readonly planPermissionService: PlanPermissionService,
    private readonly store: EnergyMonitoringStore
  ) {}

  async loadReadings(showLoading = true): Promise<void> {
    if (showLoading) {
      this.startRequest();
    } else {
      this.store.setError(null);
    }

    try {
      const responses = await firstValueFrom(
        this.energyReadingsApi.findAllForCurrentUser()
      );
      const dashboardSummary = await firstValueFrom(
        this.energyReadingsApi.getDashboardSummary()
      );

      const readings = responses
        .map((response) => this.energyReadingAssembler.toEntity(response))
        .sort(
          (first, second) =>
            new Date(second.recordedAt).getTime() -
            new Date(first.recordedAt).getTime()
        );

      this.store.setReadings(readings);
      this.store.resetFilter();
      this.store.setDashboardSummary(dashboardSummary);
    } catch (error) {
      console.error(error);
      this.store.setError('energy.loadError');
    } finally {
      if (showLoading) {
        this.finishRequest();
      }
    }
  }

  async loadSamplingSeconds(): Promise<number> {
    const response = await firstValueFrom(
      this.energyReadingsApi.getSamplingSettings()
    );

    return response.sampleSeconds;
  }

  async updateSamplingSeconds(sampleSeconds: number): Promise<number> {
    const response = await firstValueFrom(
      this.energyReadingsApi.updateSamplingSettings(sampleSeconds)
    );

    await this.loadReadings(false);
    return response.sampleSeconds;
  }

  async filterByDateRange(criteria: EnergyReadingsFilterCriteria): Promise<boolean> {
  this.startRequest();

  try {
    if (!criteria.startDate || !criteria.endDate) {
      this.store.setFilteredReadings([]);
      this.store.setError('Selecciona una fecha inicial y una fecha final.');
      return false;
    }

    if (criteria.startDate > criteria.endDate) {
      this.store.setFilteredReadings([]);
      this.store.setError('La fecha inicial no puede ser mayor que la fecha final.');
      return false;
    }

    const today = this.toInputDate(new Date());

    if (criteria.startDate > today || criteria.endDate > today) {
      this.store.setFilteredReadings([]);
      this.store.setError('No puedes filtrar fechas futuras.');
      return false;
    }

    const responses = await firstValueFrom(
      this.energyReadingsApi.findCurrentUserByDateRange(
        criteria.startDate,
        criteria.endDate
      )
    );

    const readings = responses
      .map((response) => this.energyReadingAssembler.toEntity(response))
      .sort(
        (first, second) =>
          new Date(second.recordedAt).getTime() -
          new Date(first.recordedAt).getTime()
      );

    this.store.setFilteredReadings(readings);
    this.store.setError(null);

    return true;
  } catch (error) {
    console.error(error);
    this.store.setFilteredReadings([]);
    this.store.setError('No se pudieron filtrar las lecturas.');
    return false;
  } finally {
    this.finishRequest();
  }
}

  resetFilter(): void {
    this.store.resetFilter();
    this.store.setError(null);
  }

  exportCsv(command: ExportEnergyReadingsCommand): boolean {
    this.store.setError(null);

    const activePlanCode = this.billingFacade.activePlanCode();

    const canExport = this.planPermissionService.canExportCsv(activePlanCode);

    if (!canExport) {
      this.store.setError('energy.exportNotAllowed');
      return false;
    }

    const readings = command.readings ?? this.store.visibleReadings();

    if (readings.length === 0) {
      this.store.setError('energy.emptyReadings');
      return false;
    }

    const header = [
      'id',
      'userId',
      'deviceId',
      'deviceName',
      'watts',
      'kilowattHours',
      'estimatedCost',
      'sampleSeconds',
      'recordedAt',
      'status',
    ];

    const rows = readings.map((reading) => [
      reading.id,
      reading.userId,
      reading.deviceId,
      reading.deviceName,
      reading.watts,
      reading.kilowattHours,
      reading.estimatedCost,
      reading.sampleSeconds,
      reading.recordedAt,
      reading.status,
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value)}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = command.fileName.endsWith('.csv')
      ? command.fileName
      : `${command.fileName}.csv`;

    anchor.click();
    URL.revokeObjectURL(url);

    return true;
  }

  clearMessages(): void {
    this.store.clearMessages();
  }

  private startRequest(): void {
    this.store.setLoading(true);
    this.store.clearMessages();
  }

  private finishRequest(): void {
    this.store.setLoading(false);
  }
}
