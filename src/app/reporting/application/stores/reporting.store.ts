import { Injectable, computed, signal } from '@angular/core';

import { ConsumptionReport } from '../../domain/model/consumption-report.entity';
import { EnergyGoal } from '../../domain/model/energy-goal.entity';
import { ReportingEvent } from '../../domain/model/reporting-event.entity';
import { ReportSummaryService } from '../../domain/services/report-summary.service';

@Injectable({
  providedIn: 'root',
})
export class ReportingStore {
  private readonly consumptionReportsSignal = signal<ConsumptionReport[]>([]);
  private readonly energyGoalsSignal = signal<EnergyGoal[]>([]);
  private readonly reportingEventsSignal = signal<ReportingEvent[]>([]);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly consumptionReports = computed(() => this.consumptionReportsSignal());
  readonly energyGoals = computed(() => this.energyGoalsSignal());
  readonly reportingEvents = computed(() => this.reportingEventsSignal());

  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly activeGoals = computed(() =>
    this.energyGoalsSignal().filter((goal) => goal.isActive)
  );

  readonly completedGoals = computed(() =>
    this.energyGoalsSignal().filter((goal) => goal.isCompleted)
  );

  readonly failedGoals = computed(() =>
    this.energyGoalsSignal().filter((goal) => goal.isFailed)
  );

  readonly totalReportedWatts = computed(() =>
    this.reportSummaryService.calculateTotalReportedWatts(
      this.consumptionReportsSignal()
    )
  );

  readonly averageReportedWatts = computed(() =>
    this.reportSummaryService.calculateAverageReportedWatts(
      this.consumptionReportsSignal()
    )
  );

  readonly highestReport = computed(() =>
    this.reportSummaryService.findHighestReport(this.consumptionReportsSignal())
  );

  constructor(private readonly reportSummaryService: ReportSummaryService) {}

  setConsumptionReports(value: ConsumptionReport[]): void {
    this.consumptionReportsSignal.set(this.sortConsumptionReports(value));
  }

  upsertConsumptionReport(value: ConsumptionReport): void {
    this.consumptionReportsSignal.update((reports) =>
      this.sortConsumptionReports([
        value,
        ...reports.filter((report) => report.id !== value.id),
      ])
    );
  }

  removeConsumptionReport(reportId: number): void {
    this.consumptionReportsSignal.update((reports) =>
      reports.filter((report) => report.id !== reportId)
    );
  }

  setEnergyGoals(value: EnergyGoal[]): void {
    this.energyGoalsSignal.set(value);
  }

  setReportingEvents(value: ReportingEvent[]): void {
    this.reportingEventsSignal.set(this.sortReportingEvents(value));
  }

  prependEnergyGoal(value: EnergyGoal): void {
    this.energyGoalsSignal.update((goals) => [value, ...goals]);
  }

  updateEnergyGoal(value: EnergyGoal): void {
    this.energyGoalsSignal.update((goals) =>
      goals.map((goal) => (goal.id === value.id ? value : goal))
    );
  }

  removeEnergyGoal(goalId: number): void {
    this.energyGoalsSignal.update((goals) =>
      goals.filter((goal) => goal.id !== goalId)
    );
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
    this.consumptionReportsSignal.set([]);
    this.energyGoalsSignal.set([]);
    this.reportingEventsSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }

  private sortConsumptionReports(reports: ConsumptionReport[]): ConsumptionReport[] {
    return [...reports].sort((first, second) => {
      const startDiff =
        new Date(first.startDate).getTime() - new Date(second.startDate).getTime();

      if (startDiff !== 0) {
        return startDiff;
      }

      const endDiff =
        new Date(first.endDate).getTime() - new Date(second.endDate).getTime();

      return endDiff !== 0 ? endDiff : first.id - second.id;
    });
  }

  private sortReportingEvents(events: ReportingEvent[]): ReportingEvent[] {
    return [...events].sort((first, second) => {
      const occurredDiff =
        new Date(second.occurredOn).getTime() - new Date(first.occurredOn).getTime();

      return occurredDiff !== 0 ? occurredDiff : second.id - first.id;
    });
  }
}
