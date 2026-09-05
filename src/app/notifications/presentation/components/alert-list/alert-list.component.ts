import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  AppDropdownComponent,
  DropdownTone,
} from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { SeverityBadgeComponent } from '../../../../shared/presentation/components/severity-badge/severity-badge.component';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { Alert } from '../../../domain/model/alert.entity';

export interface AlertContextItem {
  label: string;
  value: string;
}

export type AlertListItem = Alert & {
  visualLevel?: string;
  severityScore?: number;
  kind?: string;
  sourceLabel?: string;
  evidenceLabel?: string;
  recommendedAction?: string;
  contextItems?: AlertContextItem[];
  explanation?: string;
  threadKey?: string;
  sourceType?: string;
  firstDetectedAt?: string;
  lastUpdatedAt?: string;
};

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [
    TranslateModule,
    AppDropdownComponent,
    SeverityBadgeComponent,
    AppButtonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './alert-list.component.html',
  styleUrls: ['./alert-list.component.scss'],
})
export class AlertListComponent implements OnChanges {
  @Input() alerts: AlertListItem[] = [];

  @Output() markAsRead = new EventEmitter<number>();
  @Output() remove = new EventEmitter<number>();
  @Output() dismissForTenMinutes = new EventEmitter<AlertListItem>();

  private readonly actionDelayMs = 420;
  private readonly enterAnimationMs = 560;
  private readonly removeRecoveryMs = 1800;
  private readonly readGlowMs = 1180;
  private hasRenderedAlerts = false;
  private knownAlertIds = new Set<number>();
  private readonly enteringAlerts = new Set<number>();
  private readonly selectedDetailByAlert = new Map<number, string>();
  private readonly markingAsRead = new Set<number>();
  private readonly removingAlerts = new Set<number>();

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly translate: TranslateService
  ) {}

  ngOnChanges(): void {
    const visibleAlertIds = new Set(this.alerts.map((alert) => alert.id));

    if (this.hasRenderedAlerts) {
      for (const alert of this.alerts) {
        if (!this.knownAlertIds.has(alert.id) && !this.removingAlerts.has(alert.id)) {
          this.enteringAlerts.add(alert.id);
          window.setTimeout(() => this.finishEnterAnimation(alert.id), this.enterAnimationMs);
        }
      }
    }

    for (const alert of this.alerts) {
      if (!alert.isUnread && this.markingAsRead.has(alert.id)) {
        window.setTimeout(() => this.finishReadAnimation(alert.id), this.readGlowMs);
      }
    }

    for (const alertId of Array.from(this.removingAlerts)) {
      if (!visibleAlertIds.has(alertId)) {
        this.removingAlerts.delete(alertId);
        this.selectedDetailByAlert.delete(alertId);
      }
    }

    this.knownAlertIds = visibleAlertIds;
    this.hasRenderedAlerts = true;
  }

  selectedDetail(alert: AlertListItem): AlertContextItem | null {
    const items = alert.contextItems ?? [];

    if (!items.length) {
      return null;
    }

    const selectedLabel = this.selectedDetailByAlert.get(alert.id) ?? items[0].label;

    return items.find((item) => item.label === selectedLabel) ?? items[0];
  }

  selectDetailByLabel(alert: AlertListItem, label: string): void {
    this.selectedDetailByAlert.set(alert.id, label);
  }

  requestMarkAsRead(alert: AlertListItem): void {
    if (this.markingAsRead.has(alert.id) || this.removingAlerts.has(alert.id)) {
      return;
    }

    this.markingAsRead.add(alert.id);
    window.setTimeout(() => {
      this.markAsRead.emit(alert.id);
      window.setTimeout(() => this.finishReadAnimation(alert.id), this.readGlowMs);
    }, this.actionDelayMs);
  }

  requestRemove(alert: AlertListItem): void {
    if (this.removingAlerts.has(alert.id)) {
      return;
    }

    this.removingAlerts.add(alert.id);
    window.setTimeout(() => this.remove.emit(alert.id), this.actionDelayMs);

    window.setTimeout(() => {
      if (this.alerts.some((currentAlert) => currentAlert.id === alert.id)) {
        this.removingAlerts.delete(alert.id);
        this.changeDetectorRef.detectChanges();
      }
    }, this.removeRecoveryMs);
  }

  isMarkingAsRead(alert: AlertListItem): boolean {
    return this.markingAsRead.has(alert.id);
  }

  isRemoving(alert: AlertListItem): boolean {
    return this.removingAlerts.has(alert.id);
  }

  isEntering(alert: AlertListItem): boolean {
    return this.enteringAlerts.has(alert.id);
  }

  contextOptions(alert: AlertListItem): DropdownOption[] {
    return (alert.contextItems ?? []).map((item) => ({
      label: item.label,
      value: item.label,
    }));
  }

  detailTone(alert: AlertListItem): DropdownTone {
    const tones: Record<string, DropdownTone> = {
      STABLE: 'success',
      SUCCESS: 'success',
      INFO: 'info',
      WARNING: 'warning',
      CRITICAL: 'critical',
    };

    return tones[this.displayLevel(alert)] ?? 'default';
  }

  displayLevel(alert: AlertListItem): string {
    return alert.visualLevel ?? alert.level;
  }

  displayLevelLabel(alert: AlertListItem): string {
    const labels: Record<string, string> = {
      STABLE: 'alerts.levels.stable',
      SUCCESS: 'alerts.levels.success',
      INFO: 'alerts.levels.info',
      WARNING: 'alerts.levels.warning',
      CRITICAL: 'alerts.levels.critical',
    };

    const key = labels[this.displayLevel(alert)];

    return key ? this.t(key) : this.displayLevel(alert);
  }

  severityScore(alert: AlertListItem): number {
    const score = alert.severityScore ?? this.defaultSeverityScore(alert);

    return Number(Math.max(0, Math.min(100, score)).toFixed(4));
  }

  severityPercentLabel(alert: AlertListItem): string {
    return this.severityScore(alert).toFixed(2);
  }

  severityDescription(alert: AlertListItem): string {
    const labels: Record<string, string> = {
      STABLE: 'alerts.severityDescriptions.stable',
      SUCCESS: 'alerts.severityDescriptions.success',
      INFO: 'alerts.severityDescriptions.info',
      WARNING: 'alerts.severityDescriptions.warning',
      CRITICAL: 'alerts.severityDescriptions.critical',
    };

    return this.t(labels[this.displayLevel(alert)] ?? 'alerts.severityDescriptions.default');
  }

  private finishReadAnimation(alertId: number): void {
    this.markingAsRead.delete(alertId);
    this.changeDetectorRef.detectChanges();
  }

  private finishEnterAnimation(alertId: number): void {
    this.enteringAlerts.delete(alertId);
    this.changeDetectorRef.detectChanges();
  }

  private defaultSeverityScore(alert: AlertListItem): number {
    const scores: Record<string, number> = {
      STABLE: 12,
      SUCCESS: 14,
      INFO: 37,
      WARNING: 63,
      CRITICAL: 88,
    };

    return scores[this.displayLevel(alert)] ?? 37;
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
