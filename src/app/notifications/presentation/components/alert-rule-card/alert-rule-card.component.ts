import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AlertRule } from '../../../domain/model/alert-rule.entity';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';

@Component({
  selector: 'app-alert-rule-card',
  standalone: true,
  imports: [TranslateModule, AppButtonComponent],
  templateUrl: './alert-rule-card.component.html',
  styleUrls: ['./alert-rule-card.component.scss'],
})
export class AlertRuleCardComponent {
  @Input({ required: true }) rule!: AlertRule;

  @Output() toggle = new EventEmitter<AlertRule>();
  @Output() remove = new EventEmitter<number>();

  constructor(private readonly translate: TranslateService) {}

  metricLabel(): string {
    const labels: Record<string, string> = {
      WATTS: 'alertRules.metrics.watts',
      HIGH_READING_COUNT: 'alertRules.metrics.highReadingCount',
      AVERAGE_WATTS: 'alertRules.metrics.averageWatts',
    };

    return this.t(labels[this.rule.metric] ?? this.rule.metric);
  }

  conditionLabel(): string {
    const labels: Record<string, string> = {
      GREATER_THAN: 'alertRules.conditions.greaterThanLower',
      GREATER_OR_EQUAL_THAN: 'alertRules.conditions.greaterOrEqualLower',
    };

    return this.t(labels[this.rule.condition] ?? this.rule.condition);
  }

  levelLabel(): string {
    const labels: Record<string, string> = {
      STABLE: 'alerts.levels.stable',
      SUCCESS: 'alerts.levels.success',
      INFO: 'alerts.levels.info',
      WARNING: 'alerts.levels.warning',
      CRITICAL: 'alerts.levels.critical',
    };

    return this.t(labels[this.rule.level] ?? this.rule.level);
  }

  thresholdLabel(): string {
    return this.rule.metric === 'HIGH_READING_COUNT'
      ? this.t('alertRules.readingsValue', { count: this.rule.threshold })
      : `${this.rule.threshold} W`;
  }

  get statusLabelKey(): string {
    return this.rule.enabled ? 'routines.status.active' : 'routines.status.paused';
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
