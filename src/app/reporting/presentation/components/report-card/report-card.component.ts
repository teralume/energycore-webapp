import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConsumptionReport,
  ConsumptionReportPeriod,
} from '../../../domain/model/consumption-report.entity';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [TranslateModule, AppButtonComponent],
  templateUrl: './report-card.component.html',
  styleUrls: ['./report-card.component.scss'],
})
export class ReportCardComponent {
  @Input({ required: true }) report!: ConsumptionReport;

  @Output() exported = new EventEmitter<number>();
  @Output() remove = new EventEmitter<number>();

  constructor(
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService
  ) {}

  onExport(): void {
    this.exported.emit(this.report.id);
  }

  onRemove(): void {
    this.remove.emit(this.report.id);
  }

  getCleanTitle(): string {
    const title = this.report.title?.trim();

    if (!title) {
      return this.t('reporting.reportFallbackTitle');
    }

    return title
      .replace(/\s*\|\s*\d{4}-\d{2}-\d{2}\s*\/\s*\d{4}-\d{2}-\d{2}.*/g, '')
      .replace(/\s*\|\s*\d{2}\/\d{2}\/\d{4}\s*\/\s*\d{2}\/\d{2}\/\d{4}.*/g, '')
      .trim();
  }

  periodLabel(period: ConsumptionReportPeriod): string {
    return this.t(`reporting.periods.${period.toLowerCase()}`);
  }

  formatWatts(value: number): string {
    if (value >= 1000) {
      return `${(value / 1000).toLocaleString(this.currentLocale(), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} kW`;
    }

    return `${value.toLocaleString(this.currentLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} W`;
  }

  formatDate(value: string): string {
    if (!value) {
      return this.t('reporting.emptyValue');
    }

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
