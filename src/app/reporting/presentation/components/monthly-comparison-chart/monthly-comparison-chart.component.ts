import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import {
  ConsumptionReport,
  ConsumptionReportPeriod,
} from '../../../domain/model/consumption-report.entity';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import {
  DraggableBarCarouselComponent,
  DraggableBarCarouselItem,
} from '../../../../shared/presentation/components/draggable-bar-carousel/draggable-bar-carousel.component';
import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';

@Component({
  selector: 'app-monthly-comparison-chart',
  standalone: true,
  imports: [
    EmptyStateComponent,
    TranslateModule,
    AppDropdownComponent,
    SectionCardComponent,
    DraggableBarCarouselComponent,
  ],
  templateUrl: './monthly-comparison-chart.component.html',
  styleUrls: ['./monthly-comparison-chart.component.scss'],
})
export class MonthlyComparisonChartComponent implements OnDestroy {
  private _reports: ConsumptionReport[] = [];

  @Input()
  set reports(value: ConsumptionReport[] | null) {
    this._reports = value ?? [];
    this.syncChart();
  }

  get reports(): ConsumptionReport[] {
    return this._reports;
  }

  @Output() reportSelected = new EventEmitter<ConsumptionReport>();

  selectedPeriod: ConsumptionReportPeriod = 'MONTHLY';
  chartReports: ConsumptionReport[] = [];
  chartItems: DraggableBarCarouselItem[] = [];
  private chartMaxWatts = 1;
  private readonly languageChangeSubscription: Subscription;

  readonly periodOptions: DropdownOption[] = [
    { label: 'Diarios', labelKey: 'reporting.periodOptions.daily', value: 'DAILY' },
    { label: 'Semanales', labelKey: 'reporting.periodOptions.weekly', value: 'WEEKLY' },
    { label: 'Mensuales', labelKey: 'reporting.periodOptions.monthly', value: 'MONTHLY' },
    { label: 'Anuales', labelKey: 'reporting.periodOptions.yearly', value: 'YEARLY' },
  ];

  constructor(
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService
  ) {
    this.languageChangeSubscription = this.translate.onLangChange.subscribe(() => {
      this.syncChart();
    });
  }

  ngOnDestroy(): void {
    this.languageChangeSubscription.unsubscribe();
  }

  get filteredReports(): ConsumptionReport[] {
    return this.reports.filter((report) => report.period === this.selectedPeriod);
  }

  getBarPercentage(totalWatts: number): number {
    return Math.max(8, Math.round((totalWatts / this.chartMaxWatts) * 100));
  }

  selectReport(report: ConsumptionReport): void {
    this.reportSelected.emit(report);
  }

  selectCarouselItem(item: DraggableBarCarouselItem): void {
    const report = this.chartReports.find((entry) => String(entry.id) === item.key);

    if (report) {
      this.selectReport(report);
    }
  }

  onPeriodChange(value: string): void {
    if (!this.isReportPeriod(value) || value === this.selectedPeriod) {
      return;
    }

    this.selectedPeriod = value;
    this.syncChart();
  }

  selectedPeriodLabel(): string {
    return this.t(this.periodLabelKey(this.selectedPeriod)).toLocaleLowerCase(
      this.currentLocale()
    );
  }

  formatWatts(value: number): string {
    if (value >= 1000) {
      return `${this.formatNumber(value / 1000, 2)} kW`;
    }

    return `${this.formatNumber(value, 2)} W`;
  }

  private formatReportCaption(report: ConsumptionReport): string {
    if (this.selectedPeriod === 'YEARLY') {
      return report.startDate.slice(0, 4);
    }

    return report.generatedAt.slice(5);
  }

  private formatDate(value: string): string {
    const [datePart] = value.split('T');
    const [year, month, day] = datePart.split('-');

    if (!year || !month || !day) {
      return value;
    }

    return new Intl.DateTimeFormat(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  private syncChart(): void {
    this.chartReports = [...this.filteredReports].sort(
      (first, second) => this.reportTime(first) - this.reportTime(second)
    );
    this.chartMaxWatts = Math.max(
      ...this.chartReports.map((report) => report.totalWatts),
      1
    );
    this.chartItems = this.chartReports.map((report) => ({
      key: String(report.id),
      value: this.formatWatts(report.totalWatts),
      caption: this.formatReportCaption(report),
      percentage: this.getBarPercentage(report.totalWatts),
      title: report.title || this.t('reporting.reportFallbackTitleWithId', { id: report.id }),
      subtitle: `${this.formatDate(report.startDate)} - ${this.formatDate(report.endDate)}`,
      detail: this.t('reporting.averageDetail', {
        value: this.formatWatts(report.averageWatts),
      }),
      ariaLabel: this.t('reporting.reportChartAria', {
        title: report.title || this.t('reporting.reportFallbackTitleWithId', { id: report.id }),
        total: this.formatWatts(report.totalWatts),
        start: this.formatDate(report.startDate),
        end: this.formatDate(report.endDate),
      }),
    }));
  }

  private periodLabelKey(period: ConsumptionReportPeriod): string {
    return `reporting.periodOptions.${period.toLowerCase()}`;
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

  private formatNumber(value: number, decimals: number): string {
    return Number(value || 0).toLocaleString(this.currentLocale(), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  private reportTime(report: ConsumptionReport): number {
    const startTime = new Date(report.startDate).getTime();
    const generatedTime = new Date(report.generatedAt).getTime();

    if (!Number.isNaN(startTime)) {
      return startTime;
    }

    return Number.isNaN(generatedTime) ? report.id : generatedTime;
  }

  private isReportPeriod(value: string): value is ConsumptionReportPeriod {
    return ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(value);
  }
}
