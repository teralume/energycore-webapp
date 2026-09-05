import { Injectable, computed, signal } from '@angular/core';

import { EnergyReading } from '../../domain/model/energy-reading.entity';
import { EnergyRecommendationService } from '../../domain/services/energy-recommendation.service';
import { EnergyStatisticsService } from '../../domain/services/energy-statistics.service';
import { EnergyDashboardSummaryResponse } from '../../infrastructure/responses/energy-dashboard-summary.response';

@Injectable({
  providedIn: 'root',
})
export class EnergyMonitoringStore {
  private readonly readingsSignal = signal<EnergyReading[]>([]);
  private readonly filteredReadingsSignal = signal<EnergyReading[]>([]);
  private readonly filterActiveSignal = signal<boolean>(false);
  private readonly dashboardSummarySignal =
    signal<EnergyDashboardSummaryResponse | null>(null);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly readings = computed(() => this.readingsSignal());
  readonly filteredReadings = computed(() => this.filteredReadingsSignal());
  readonly dashboardSummary = computed(() => this.dashboardSummarySignal());

  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly visibleReadings = computed(() => {
  return this.filterActiveSignal()
    ? this.filteredReadingsSignal()
    : this.readingsSignal();
});

  readonly totalWatts = computed(() =>
    this.statisticsService.calculateTotalWatts(this.visibleReadings())
  );

  readonly averageWatts = computed(() =>
    this.statisticsService.calculateAverageWatts(this.visibleReadings())
  );

  readonly highestReading = computed(() =>
    this.statisticsService.findHighestReading(this.visibleReadings())
  );

  readonly highReadingsCount = computed(() =>
    this.statisticsService.countHighReadings(this.visibleReadings())
  );

  readonly normalReadingsCount = computed(() =>
    this.statisticsService.countNormalReadings(this.visibleReadings())
  );

  readonly recommendationKey = computed(() =>
    this.recommendationService.getRecommendationKey(this.visibleReadings())
  );

  readonly groupedByDevice = computed(() =>
    this.statisticsService.groupByDevice(this.visibleReadings())
  );

  constructor(
    private readonly statisticsService: EnergyStatisticsService,
    private readonly recommendationService: EnergyRecommendationService
  ) {}

  setReadings(value: EnergyReading[]): void {
    this.readingsSignal.set(value);
  }

  setFilteredReadings(value: EnergyReading[]): void {
  this.filteredReadingsSignal.set(value);
  this.filterActiveSignal.set(true);
}

  setDashboardSummary(value: EnergyDashboardSummaryResponse | null): void {
    this.dashboardSummarySignal.set(value);
  }

  resetFilter(): void {
  this.filteredReadingsSignal.set([]);
  this.filterActiveSignal.set(false);
}
  setLoading(value: boolean): void {
    this.loadingSignal.set(value);
  }

  setError(value: string | null): void {
    this.errorSignal.set(value);
  }

  clearMessages(): void {
    this.errorSignal.set(null);
  }

  reset(): void {
    this.readingsSignal.set([]);
    this.filteredReadingsSignal.set([]);
    this.dashboardSummarySignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
