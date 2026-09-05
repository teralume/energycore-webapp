import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { BillingFacade } from '../../../billing/application/services/billing.facade';
import { PlanPermissionService } from '../../../billing/domain/services/plan-permission.service';
import { EnergyMonitoringFacade } from '../../../energy-monitoring/application/services/energy-monitoring.facade';

import { ConsumptionReport } from '../../domain/model/consumption-report.entity';
import { EnergyGoalPolicyService } from '../../domain/services/energy-goal-policy.service';

import { CreateConsumptionReportCommand } from '../commands/create-consumption-report.command';
import { CreateEnergyGoalCommand } from '../commands/create-energy-goal.command';
import { ExportReportCommand } from '../commands/export-report.command';
import { UpdateEnergyGoalCommand } from '../commands/update-energy-goal.command';

import { ConsumptionReportsApiService } from '../../infrastructure/api/consumption-reports-api.service';
import { EnergyGoalsApiService } from '../../infrastructure/api/energy-goals-api.service';
import { ReportingEventsApiService } from '../../infrastructure/api/reporting-events-api.service';

import { ConsumptionReportAssembler } from '../../infrastructure/assemblers/consumption-report.assembler';
import { EnergyGoalAssembler } from '../../infrastructure/assemblers/energy-goal.assembler';
import { ReportingEventAssembler } from '../../infrastructure/assemblers/reporting-event.assembler';

import { ReportingStore } from '../stores/reporting.store';

export type CreateConsumptionReportResult =
  | 'CREATED'
  | 'UPDATED'
  | 'UNCHANGED'
  | 'FAILED';

@Injectable({
  providedIn: 'root',
})
export class ReportingFacade {
  private readonly consumptionReportAssembler = new ConsumptionReportAssembler();
  private readonly energyGoalAssembler = new EnergyGoalAssembler();
  private readonly reportingEventAssembler = new ReportingEventAssembler();

  get consumptionReports() {
    return this.store.consumptionReports;
  }

  get energyGoals() {
    return this.store.energyGoals;
  }

  get reportingEvents() {
    return this.store.reportingEvents;
  }

  get loading() {
    return this.store.loading;
  }

  get error() {
    return this.store.error;
  }

  get activeGoals() {
    return this.store.activeGoals;
  }

  get completedGoals() {
    return this.store.completedGoals;
  }

  get failedGoals() {
    return this.store.failedGoals;
  }

  get totalReportedWatts() {
    return this.store.totalReportedWatts;
  }

  get averageReportedWatts() {
    return this.store.averageReportedWatts;
  }

  get highestReport() {
    return this.store.highestReport;
  }

  get energyReadings() {
    return this.energyMonitoringFacade.readings;
  }

  constructor(
    private readonly consumptionReportsApi: ConsumptionReportsApiService,
    private readonly energyGoalsApi: EnergyGoalsApiService,
    private readonly reportingEventsApi: ReportingEventsApiService,
    private readonly billingFacade: BillingFacade,
    private readonly energyMonitoringFacade: EnergyMonitoringFacade,
    private readonly energyGoalPolicyService: EnergyGoalPolicyService,
    private readonly planPermissionService: PlanPermissionService,
    private readonly store: ReportingStore
  ) {}

  async loadReporting(): Promise<void> {
    this.startRequest();

    try {
      await Promise.all([
        this.loadConsumptionReports(),
        this.loadEnergyGoals(),
        this.loadReportingEvents(),
        this.energyMonitoringFacade.loadReadings(),
      ]);
    } catch (error) {
      console.error(error);
      this.store.setError('reporting.loadError');
    } finally {
      this.finishRequest();
    }
  }

  async loadConsumptionReports(): Promise<void> {
    const responses = await firstValueFrom(
      this.consumptionReportsApi.findAllForCurrentUser()
    );

    const reports = responses.map((response) =>
      this.consumptionReportAssembler.toEntity(response)
    );

    this.store.setConsumptionReports(reports);
  }

  async loadEnergyGoals(): Promise<void> {
    const responses = await firstValueFrom(
      this.energyGoalsApi.findAllForCurrentUser()
    );

    const goals = responses.map((response) =>
      this.energyGoalAssembler.toEntity(response)
    );

    this.store.setEnergyGoals(goals);
  }

  async loadReportingEvents(): Promise<void> {
    const responses = await firstValueFrom(
      this.reportingEventsApi.findAllForCurrentUser()
    );

    const events = responses.map((response) =>
      this.reportingEventAssembler.toEntity(response)
    );

    this.store.setReportingEvents(events);
  }

  async createConsumptionReport(
    command: CreateConsumptionReportCommand
  ): Promise<CreateConsumptionReportResult> {
    this.startRequest();

    try {
      const existingReport = this.store
        .consumptionReports()
        .find(
          (report) =>
            report.startDate === command.startDate &&
            report.endDate === command.endDate
        );
      const response = await firstValueFrom(
        this.consumptionReportsApi.create({
          startDate: command.startDate,
          endDate: command.endDate,
        })
      );

      const report = this.consumptionReportAssembler.toEntity(response);

      this.store.upsertConsumptionReport(report);
      this.store.setError(null);

      if (!existingReport) {
        return 'CREATED';
      }

      return this.isClosedReportCycle(command.endDate)
        ? 'UNCHANGED'
        : 'UPDATED';
    } catch (error) {
      console.error(error);
      this.store.setError('reporting.reportCreateError');
      return 'FAILED';
    } finally {
      this.finishRequest();
    }
  }

  async deleteConsumptionReport(reportId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.consumptionReportsApi.delete(reportId));
      this.store.removeConsumptionReport(reportId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('reporting.reportDeleteError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  exportReport(command: ExportReportCommand): boolean {
    this.store.setError(null);

    const canExport = this.planPermissionService.canExportCsv(
      this.billingFacade.activePlanCode()
    );

    if (!canExport) {
      this.store.setError('reporting.exportNotAllowed');
      return false;
    }

    const report: ConsumptionReport | undefined = this.store
      .consumptionReports()
      .find((item) => item.id === command.reportId);

    if (!report) {
      this.store.setError('reporting.reportNotFound');
      return false;
    }

    const content = [
      'ENERGYCORE CONSUMPTION REPORT',
      `Report ID: ${report.id}`,
      `Title: ${report.title}`,
      `Period: ${report.period}`,
      `Start Date: ${report.startDate}`,
      `End Date: ${report.endDate}`,
      `Total Watts: ${report.totalWatts}`,
      `Average Watts: ${report.averageWatts}`,
      `Highest Watts: ${report.highestWatts}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `energycore-report-${report.id}.txt`;
    anchor.click();

    URL.revokeObjectURL(url);
    return true;
  }

  async createEnergyGoal(command: CreateEnergyGoalCommand): Promise<boolean> {
    this.startRequest();

    try {
      const status = this.energyGoalPolicyService.resolveStatus({
        targetKilowattHours: Number(command.targetKilowattHours),
        currentKilowattHours: 0,
        deadline: command.deadline,
      });
      const currentKilowattHours = this.energyMonitoringFacade
        .readings()
        .reduce((total, reading) => total + reading.kilowattHours, 0);

      const response = await firstValueFrom(
        this.energyGoalsApi.create({
          title: command.title.trim(),
          targetKilowattHours: Number(command.targetKilowattHours),
          currentKilowattHours,
          deadline: command.deadline,
          status,
          createdAt: new Date().toISOString().slice(0, 10),
          scopeType: command.scopeType ?? 'GENERAL',
          scopeId: command.scopeId ?? null,
          scopeName: command.scopeName ?? null,
          activeFrom: command.activeFrom ?? null,
          activeTo: command.activeTo ?? null,
        })
      );

      const goal = this.energyGoalAssembler.toEntity(response);
      this.store.prependEnergyGoal(goal);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('reporting.goalCreateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async updateEnergyGoal(command: UpdateEnergyGoalCommand): Promise<boolean> {
    this.startRequest();

    try {
      const status = this.energyGoalPolicyService.resolveStatus({
        targetKilowattHours: Number(command.targetKilowattHours),
        currentKilowattHours: Number(command.currentKilowattHours),
        deadline: command.deadline,
      });

      const response = await firstValueFrom(
        this.energyGoalsApi.patch(command.goalId, {
          title: command.title.trim(),
          targetKilowattHours: Number(command.targetKilowattHours),
          currentKilowattHours: Number(command.currentKilowattHours),
          deadline: command.deadline,
          status,
          scopeType: command.scopeType ?? 'GENERAL',
          scopeId: command.scopeId ?? null,
          scopeName: command.scopeName ?? null,
          activeFrom: command.activeFrom ?? null,
          activeTo: command.activeTo ?? null,
        })
      );

      const goal = this.energyGoalAssembler.toEntity(response);
      this.store.updateEnergyGoal(goal);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('reporting.goalUpdateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async deleteEnergyGoal(goalId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.energyGoalsApi.delete(goalId));
      this.store.removeEnergyGoal(goalId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('reporting.goalDeleteError');
      return false;
    } finally {
      this.finishRequest();
    }
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

  private isClosedReportCycle(endDate: string): boolean {
    const today = new Date();
    const todayAtMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return new Date(`${endDate}T00:00:00`).getTime() < todayAtMidnight.getTime();
  }
}
