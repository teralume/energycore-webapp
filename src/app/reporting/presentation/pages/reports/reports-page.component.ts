import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { EnergyReading } from '../../../../energy-monitoring/domain/model/energy-reading.entity';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { AppWheelSelectorComponent } from '../../../../shared/presentation/components/app-wheel-selector/app-wheel-selector.component';
import { WheelOption } from '../../../../shared/presentation/components/app-wheel-selector/wheel-option.model';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';

import { ReportingFacade } from '../../../application/services/reporting.facade';
import {
  ConsumptionReport,
  ConsumptionReportPeriod,
} from '../../../domain/model/consumption-report.entity';

import { MonthlyComparisonChartComponent } from '../../components/monthly-comparison-chart/monthly-comparison-chart.component';
import { ReportCardComponent } from '../../components/report-card/report-card.component';

interface ReportInvoiceSummary {
  readings: number;
  devices: number;
  totalKilowattHours: number;
  totalCost: number;
  averageWatts: number;
  highestWatts: number;
  totalSeconds: number;
}

interface ReportDeviceBreakdown {
  deviceId: number;
  deviceName: string;
  readings: number;
  totalKilowattHours: number;
  totalCost: number;
  totalSeconds: number;
  averageWatts: number;
  highestWatts: number;
  share: number;
}

interface TimeRangeOption extends WheelOption<string> {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    LoadingSpinnerComponent,
    MonthlyComparisonChartComponent,
    ReportCardComponent,
    AppDropdownComponent,
    AppButtonComponent,
    EmptyStateComponent,
    AppWheelSelectorComponent,
  ],
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPageComponent implements OnInit, OnDestroy {
  title = '';
  period: ConsumptionReportPeriod = 'MONTHLY';
  selectedReport: ConsumptionReport | null = null;
  isReportDetailClosing = false;
  rangeOptions: TimeRangeOption[] = [];
  selectedRangeValue: TimeRangeOption = this.emptyRangeOption();
  private lockedScrollY = 0;
  private reportDetailCloseTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly reportDetailCloseAnimationMs = 220;
  private readonly languageChangeSubscription: Subscription;

  readonly periods: ConsumptionReportPeriod[] = [
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'YEARLY',
  ];

  readonly periodOptions: DropdownOption[] = this.periods.map((period) => ({
    label: period,
    labelKey: this.periodLabelKey(period),
    value: period,
  }));

  constructor(
    readonly reportingFacade: ReportingFacade,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    this.rangeOptions = this.buildRangeOptions(this.period);
    this.selectedRangeValue = this.getLatestRangeOption();
    this.languageChangeSubscription = this.translate.onLangChange.subscribe(() => {
      this.refreshRangeOptions();
      this.changeDetectorRef.markForCheck();
    });
  }

  async ngOnInit(): Promise<void> {
  await this.reportingFacade.loadReporting();

  if (this.reportingFacade.error()) {
    this.toastService.error(this.t('reporting.loadError'));
  }

  this.changeDetectorRef.markForCheck();
}

  ngOnDestroy(): void {
    this.clearReportDetailCloseTimeout();
    this.languageChangeSubscription.unsubscribe();
    this.unlockPageScroll();
  }

  async createReport(): Promise<void> {
  const title = this.title.trim();
  const range = this.selectedRangeValue;

  if (!title) {
    this.toastService.warning(this.t('reporting.reportNameRequired'));
    return;
  }

  if (title.length < 4) {
    this.toastService.warning(this.t('reporting.reportNameMinLength'));
    return;
  }

  if (!range.startDate || !range.endDate) {
    this.toastService.warning(this.t('reporting.reportRangeRequired'));
    return;
  }

  if (new Date(range.startDate).getTime() > new Date(range.endDate).getTime()) {
    this.toastService.warning(this.t('reporting.reportRangeInvalid'));
    return;
  }

  const result = await this.reportingFacade.createConsumptionReport({
    title,
    period: this.period,
    startDate: range.startDate,
    endDate: range.endDate,
  });

  if (result !== 'FAILED') {
    this.title = '';
    if (result === 'UPDATED') {
      this.toastService.success(this.t('reporting.reportUpdateSuccess'));
    } else if (result === 'UNCHANGED') {
      this.toastService.info(this.t('reporting.reportUnchanged'));
    } else {
      this.toastService.success(this.t('reporting.reportCreateSuccess'));
    }
  } else {
    this.toastService.error(this.t('reporting.reportCreateError'));
  }

  this.changeDetectorRef.markForCheck();
}

  onPeriodChange(value: string): void {
    this.period = value as ConsumptionReportPeriod;
    this.rangeOptions = this.buildRangeOptions(this.period);
    this.selectedRangeValue = this.getLatestRangeOption();
    this.changeDetectorRef.markForCheck();
  }

  onRangeChange(option: WheelOption): void {
    const range = this.rangeOptions.find((item) => item.value === option.value);

    if (!range) {
      return;
    }

    this.selectedRangeValue = range;
    this.changeDetectorRef.markForCheck();
  }

  rangeSelectionTitle(): string {
    if (this.period === 'DAILY') return this.t('reporting.rangeTitles.daily');
    if (this.period === 'WEEKLY') return this.t('reporting.rangeTitles.weekly');
    if (this.period === 'YEARLY') return this.t('reporting.rangeTitles.yearly');

    return this.t('reporting.rangeTitles.monthly');
  }

  selectedRangeSummary(): string {
    return `${this.formatDate(this.selectedRangeValue.startDate)} - ${this.formatDate(
      this.selectedRangeValue.endDate
    )}`;
  }

  exportReport(reportId: number): void {
  const report = this.reportingFacade
    .consumptionReports()
    .find((item) => item.id === reportId);

  if (!report) {
    this.toastService.error(this.t('reporting.reportNotFound'));
    return;
    }

    try {
    const exported = this.reportingFacade.exportReport({ reportId });

    if (exported) {
      this.toastService.success(this.t('reporting.reportExportSuccess'));
    } else if (this.reportingFacade.error() === 'reporting.exportNotAllowed') {
      this.toastService.error(this.t('reporting.exportNotAllowed'));
    } else {
      this.toastService.error(this.t('reporting.reportExportError'));
    }
  } catch (error) {
    console.error(error);
    this.toastService.error(this.t('reporting.reportExportError'));
  }
}

  async deleteReport(reportId: number): Promise<void> {
  const report = this.reportingFacade
    .consumptionReports()
    .find((item) => item.id === reportId);

  if (!report) {
    this.toastService.error(this.t('reporting.reportNotFound'));
    return;
  }

  const success = await this.reportingFacade.deleteConsumptionReport(reportId);

  if (success) {
    if (this.selectedReport?.id === reportId) {
      this.closeReportDetail();
    }

    this.toastService.info(this.t('reporting.reportDeleteSuccess'));
  } else {
    this.toastService.error(this.t('reporting.reportDeleteError'));
  }

  this.changeDetectorRef.markForCheck();
}

  openReportDetail(report: ConsumptionReport): void {
    this.clearReportDetailCloseTimeout();
    this.isReportDetailClosing = false;
    this.selectedReport = report;
    this.lockPageScroll();
    this.changeDetectorRef.markForCheck();
  }

  closeReportDetail(): void {
    if (!this.selectedReport || this.isReportDetailClosing) {
      return;
    }

    this.isReportDetailClosing = true;
    this.changeDetectorRef.markForCheck();

    this.reportDetailCloseTimeout = setTimeout(() => {
      this.selectedReport = null;
      this.isReportDetailClosing = false;
      this.reportDetailCloseTimeout = null;
      this.unlockPageScroll();
      this.changeDetectorRef.markForCheck();
    }, this.reportDetailCloseAnimationMs);
  }

  private clearReportDetailCloseTimeout(): void {
    if (this.reportDetailCloseTimeout === null) {
      return;
    }

    clearTimeout(this.reportDetailCloseTimeout);
    this.reportDetailCloseTimeout = null;
  }

  private lockPageScroll(): void {
    if (this.document.body.classList.contains('ec-modal-open')) {
      return;
    }

    const windowRef = this.document.defaultView;
    this.lockedScrollY =
      windowRef?.scrollY ?? this.document.documentElement.scrollTop ?? 0;

    this.document.documentElement.classList.add('ec-modal-open');
    this.document.body.classList.add('ec-modal-open');
    this.document.body.style.top = `-${this.lockedScrollY}px`;
  }

  private unlockPageScroll(): void {
    if (!this.document.body.classList.contains('ec-modal-open')) {
      return;
    }

    this.document.body.classList.remove('ec-modal-open');
    this.document.documentElement.classList.remove('ec-modal-open');
    this.document.body.style.top = '';
    this.document.defaultView?.scrollTo({
      top: this.lockedScrollY,
      left: 0,
      behavior: 'auto',
    });
    this.lockedScrollY = 0;
  }

  getReportReadings(report: ConsumptionReport): EnergyReading[] {
    const start = new Date(`${report.startDate}T00:00:00`).getTime();
    const end = new Date(`${report.endDate}T23:59:59.999`).getTime();

    return this.reportingFacade
      .energyReadings()
      .filter((reading) => {
        const recordedAt = new Date(reading.recordedAt).getTime();
        return recordedAt >= start && recordedAt <= end;
      })
      .sort(
        (first, second) =>
          new Date(first.recordedAt).getTime() -
          new Date(second.recordedAt).getTime()
      );
  }

  getInvoiceSummary(report: ConsumptionReport): ReportInvoiceSummary {
    const readings = this.getReportReadings(report);
    const totalKilowattHours = readings.reduce(
      (total, reading) => total + reading.kilowattHours,
      0
    );
    const totalCost = readings.reduce(
      (total, reading) => total + reading.estimatedCost,
      0
    );
    const totalWatts = readings.reduce(
      (total, reading) => total + reading.watts,
      0
    );
    const highestWatts = readings.reduce(
      (highest, reading) => Math.max(highest, reading.watts),
      0
    );
    const totalSeconds = readings.reduce(
      (total, reading) => total + reading.sampleSeconds,
      0
    );

    return {
      readings: readings.length,
      devices: new Set(readings.map((reading) => reading.deviceId)).size,
      totalKilowattHours,
      totalCost,
      averageWatts: readings.length ? totalWatts / readings.length : 0,
      highestWatts,
      totalSeconds,
    };
  }

  getDeviceBreakdown(report: ConsumptionReport): ReportDeviceBreakdown[] {
    const readings = this.getReportReadings(report);
    const totalKilowattHours = readings.reduce(
      (total, reading) => total + reading.kilowattHours,
      0
    );
    const devices = new Map<number, ReportDeviceBreakdown>();

    for (const reading of readings) {
      const current = devices.get(reading.deviceId) ?? {
        deviceId: reading.deviceId,
        deviceName: reading.deviceName,
        readings: 0,
        totalKilowattHours: 0,
        totalCost: 0,
        totalSeconds: 0,
        averageWatts: 0,
        highestWatts: 0,
        share: 0,
      };

      current.readings += 1;
      current.totalKilowattHours += reading.kilowattHours;
      current.totalCost += reading.estimatedCost;
      current.totalSeconds += reading.sampleSeconds;
      current.averageWatts += reading.watts;
      current.highestWatts = Math.max(current.highestWatts, reading.watts);

      devices.set(reading.deviceId, current);
    }

    return Array.from(devices.values())
      .map((device) => ({
        ...device,
        averageWatts: device.readings ? device.averageWatts / device.readings : 0,
        share: totalKilowattHours
          ? (device.totalKilowattHours / totalKilowattHours) * 100
          : 0,
      }))
      .sort(
        (first, second) =>
          second.totalKilowattHours - first.totalKilowattHours
      );
  }

  getTopDevices(report: ConsumptionReport): ReportDeviceBreakdown[] {
    return this.getDeviceBreakdown(report).slice(0, 5);
  }

  countHighReadings(report: ConsumptionReport): number {
    return this.getReportReadings(report).filter((reading) => reading.isHigh)
      .length;
  }

  formatDate(value: string): string {
    if (!value) return this.t('reporting.emptyValue');

    const date = this.dateFromInput(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  formatDateTime(value: string): string {
    if (!value) return this.t('reporting.emptyValue');

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  activitySourceLabelKey(sourceContext: string): string {
    const labels: Record<string, string> = {
      IAM: 'reporting.activitySources.account',
      BILLING: 'reporting.activitySources.billing',
      DEVICE_CONTROL: 'reporting.activitySources.control',
      WORKPLACE: 'reporting.activitySources.workplace',
      ENERGY_MONITORING: 'reporting.activitySources.energy',
      SERVICE_MANAGEMENT: 'reporting.activitySources.support',
    };

    return labels[sourceContext?.toUpperCase()] ?? 'reporting.activitySources.general';
  }

  formatNumber(value: number, decimals = 2): string {
    return Number(value || 0).toLocaleString(this.currentLocale(), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  formatMoney(value: number): string {
    return this.formatNumber(value, 2);
  }

  formatEnergy(value: number): string {
    if (value >= 1) {
      return `${this.formatNumber(value, 3)} kWh`;
    }

    return `${this.formatNumber(value * 1000, 2)} Wh`;
  }

  formatDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return this.t('reporting.duration.hoursMinutes', {
        hours,
        minutes,
      });
    }

    return this.t('reporting.duration.minutesOnly', {
      minutes,
    });
  }

  periodLabel(period: ConsumptionReportPeriod): string {
    return this.t(this.periodLabelKey(period));
  }

  private getLatestRangeOption(): TimeRangeOption {
    return (
      this.rangeOptions[this.rangeOptions.length - 1] ?? this.emptyRangeOption()
    );
  }

  private emptyRangeOption(): TimeRangeOption {
    return {
      label: '',
      value: '',
      sublabel: '',
      startDate: '',
      endDate: '',
    };
  }

  private buildRangeOptions(period: ConsumptionReportPeriod): TimeRangeOption[] {
    if (period === 'DAILY') {
      return this.buildDailyOptions();
    }

    if (period === 'WEEKLY') {
      return this.buildWeeklyOptions();
    }

    if (period === 'YEARLY') {
      return this.buildYearlyOptions();
    }

    return this.buildMonthlyOptions();
  }

  private buildDailyOptions(): TimeRangeOption[] {
    const today = this.todayAtMidnight();
    const pastDays = 365;

    return Array.from({ length: pastDays + 1 }, (_, index) => {
      const offset = index - pastDays;
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      const inputDate = this.toInputDate(date);

      return {
        label: this.formatShortDay(date),
        value: inputDate,
        sublabel: this.formatDate(inputDate),
        startDate: inputDate,
        endDate: inputDate,
      };
    });
  }

  private buildWeeklyOptions(): TimeRangeOption[] {
    const today = this.todayAtMidnight();
    const currentWeekStart = this.startOfWeekOnMonday(today);
    const pastWeeks = 104;

    return Array.from({ length: pastWeeks + 1 }, (_, index) => {
      const weeksBack = pastWeeks - index;
      const start = new Date(currentWeekStart);
      start.setDate(currentWeekStart.getDate() - weeksBack * 7);

      const naturalEnd = new Date(start);
      naturalEnd.setDate(start.getDate() + 6);

      const isCurrentWeek = start.getTime() === currentWeekStart.getTime();

      const startDate = this.toInputDate(start);
      const endDate = this.toInputDate(naturalEnd);

      return {
        label: `${this.formatDayMonth(start)} - ${this.formatDayMonth(naturalEnd)}`,
        value: `${startDate}:${endDate}`,
        sublabel: isCurrentWeek
          ? this.t('reporting.rangeLabels.currentWeek')
          : `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
        startDate,
        endDate,
      };
    });
  }

  private buildMonthlyOptions(): TimeRangeOption[] {
    const today = this.todayAtMidnight();
    const pastMonths = 120;

    return Array.from({ length: pastMonths + 1 }, (_, index) => {
      const offset = index - pastMonths;

      const firstDay = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      const naturalLastDay = new Date(
        firstDay.getFullYear(),
        firstDay.getMonth() + 1,
        0
      );

      const isCurrentMonth =
        firstDay.getFullYear() === today.getFullYear() &&
        firstDay.getMonth() === today.getMonth();

      const startDateValue = this.toInputDate(firstDay);
      const endDateValue = this.toInputDate(naturalLastDay);

      return {
        label: this.formatMonth(firstDay),
        value: `${startDateValue}:${endDateValue}`,
        sublabel: isCurrentMonth
          ? this.t('reporting.rangeLabels.currentYearCycle', {
              year: firstDay.getFullYear(),
            })
          : String(firstDay.getFullYear()),
        startDate: startDateValue,
        endDate: endDateValue,
      };
    });
  }

  private buildYearlyOptions(): TimeRangeOption[] {
    const today = this.todayAtMidnight();
    const currentYear = today.getFullYear();
    const pastYears = 30;

    return Array.from({ length: pastYears + 1 }, (_, index) => {
      const year = currentYear - pastYears + index;
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      const startDate = this.toInputDate(start);
      const endDate = this.toInputDate(end);

      return {
        label: String(year),
        value: `${startDate}:${endDate}`,
        sublabel: year === currentYear
          ? this.t('reporting.rangeLabels.currentYear')
          : this.t('reporting.rangeLabels.fullYear'),
        startDate,
        endDate,
      };
    });
  }

  private todayAtMidnight(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  private startOfWeekOnMonday(date: Date): Date {
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);

    return monday;
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatShortDay(date: Date): string {
    return date.toLocaleDateString(this.currentLocale(), {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  }

  private formatDayMonth(date: Date): string {
    return date.toLocaleDateString(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
    });
  }

  private formatMonth(date: Date): string {
    const value = date.toLocaleDateString(this.currentLocale(), {
      month: 'long',
    });

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private refreshRangeOptions(): void {
    const currentValue = this.selectedRangeValue.value;
    this.rangeOptions = this.buildRangeOptions(this.period);
    this.selectedRangeValue =
      this.rangeOptions.find((option) => option.value === currentValue) ??
      this.getLatestRangeOption();
  }

  private periodLabelKey(period: ConsumptionReportPeriod): string {
    return `reporting.periods.${period.toLowerCase()}`;
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

  private dateFromInput(value: string): Date {
    const [datePart] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);

    if (!year || !month || !day) {
      return new Date(value);
    }

    return new Date(year, month - 1, day);
  }

}
