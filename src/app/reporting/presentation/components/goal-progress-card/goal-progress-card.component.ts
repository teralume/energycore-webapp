import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { EnergyGoal } from '../../../domain/model/energy-goal.entity';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';

export interface EnergyGoalInsight {
  measuredKilowattHours: number;
  estimatedCost: number;
  devicesMeasured: number;
  daysRemaining: number;
  expectedProgressPercentage: number;
  projectedKilowattHours: number;
  statusLabel: string;
  statusTone: 'good' | 'warning' | 'danger';
  recommendation: string;
}

@Component({
  selector: 'app-goal-progress-card',
  standalone: true,
  imports: [TranslateModule, AppButtonComponent],
  templateUrl: './goal-progress-card.component.html',
  styleUrls: ['./goal-progress-card.component.scss'],
})
export class GoalProgressCardComponent {
  @Input({ required: true }) goal!: EnergyGoal;
  @Input({ required: true }) insight!: EnergyGoalInsight;

  @Output() remove = new EventEmitter<number>();

  constructor(
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService
  ) {}

  get progressPercentage(): number {
    if (this.goal.targetKilowattHours <= 0) {
      return 0;
    }

    const progress = (this.insight.measuredKilowattHours / this.goal.targetKilowattHours) * 100;
    return Math.min(100, Number(progress.toFixed(1)));
  }

  get remainingKilowattHours(): number {
    return Math.max(0, this.goal.targetKilowattHours - this.insight.measuredKilowattHours);
  }

  get projectedPercentage(): number {
    if (this.goal.targetKilowattHours <= 0) {
      return 0;
    }

    return Math.min(
      160,
      Number(((this.insight.projectedKilowattHours / this.goal.targetKilowattHours) * 100).toFixed(1))
    );
  }

  onRemove(): void {
    this.remove.emit(this.goal.id);
  }

  formatNumber(value: number, decimals = 2): string {
    return Number(value || 0).toLocaleString(this.currentLocale(), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  formatDate(value: string): string {
    if (!value) {
      return this.t('reporting.emptyValue');
    }

    const [datePart] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const date = year && month && day
      ? new Date(year, month - 1, day)
      : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  activeWindowLabel(): string {
    if (!this.goal.activeFrom || !this.goal.activeTo) {
      return this.t('reporting.goals.fullDay');
    }

    return `${this.goal.activeFrom} - ${this.goal.activeTo}`;
  }

  daysRemainingLabel(): string {
    return this.t('reporting.goals.daysRemaining', {
      count: this.insight.daysRemaining,
    });
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
}
