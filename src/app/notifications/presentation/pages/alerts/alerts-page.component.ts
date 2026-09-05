import { Component, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NotificationsFacade } from '../../../application/services/notifications.facade';
import { Alert, AlertLevel } from '../../../domain/model/alert.entity';
import { NotificationChannelPolicyService } from '../../../domain/services/notification-channel-policy.service';

import {
  AlertListComponent,
  AlertListItem,
} from '../../components/alert-list/alert-list.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';

type AlertFilter = 'ALL' | 'UNREAD' | AlertLevel;

@Component({
  selector: 'app-alerts-page',
  standalone: true,
  imports: [
    TranslateModule,
    AlertListComponent,
    LoadingSpinnerComponent,
    AppDropdownComponent,
    AppButtonComponent,
  ],
  templateUrl: './alerts-page.component.html',
  styleUrls: ['./alerts-page.component.scss'],
})
export class AlertsPageComponent implements OnInit {
  selectedFilter: AlertFilter = 'ALL';

  readonly filterOptions: DropdownOption[] = [
    { label: '', labelKey: 'alerts.filters.all', value: 'ALL' },
    { label: '', labelKey: 'alerts.filters.unread', value: 'UNREAD' },
    { label: '', labelKey: 'alerts.filters.stable', value: 'STABLE' },
    { label: '', labelKey: 'alerts.filters.success', value: 'SUCCESS' },
    { label: '', labelKey: 'alerts.filters.info', value: 'INFO' },
    { label: '', labelKey: 'alerts.filters.warning', value: 'WARNING' },
    { label: '', labelKey: 'alerts.filters.critical', value: 'CRITICAL' },
  ];

  constructor(
    readonly notificationsFacade: NotificationsFacade,
    private readonly notificationChannelPolicy: NotificationChannelPolicyService,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    await this.notificationsFacade.loadNotifications();
  }

  selectFilter(value: string): void {
    this.selectedFilter = value as AlertFilter;
  }

  async markAsRead(alertId: number): Promise<void> {
    const success = await this.notificationsFacade.markAsRead({ alertId });

    if (success) {
      this.toastService.success(this.t('alerts.markAsReadSuccess'));
      return;
    }

    this.toastService.error(this.t('alerts.markAsReadError'));
  }

  async deleteAlert(alertId: number): Promise<void> {
    const success = await this.notificationsFacade.deleteAlert(alertId);

    if (success) {
      this.toastService.info(this.t('alerts.deleteSuccess'));
      return;
    }

    this.toastService.error(this.t('alerts.deleteError'));
  }

  async dismissAlert(alert: AlertListItem): Promise<void> {
    const dismissed = await this.notificationsFacade.dismissAlert(alert.id, 10);

    if (dismissed) {
      this.toastService.info(this.t('alerts.dismissSuccess', { minutes: 10 }));
      return;
    }

    this.toastService.error(this.t('alerts.dismissError'));
  }

  get inboxAlerts(): AlertListItem[] {
    return this.notificationsFacade
      .sortedAlerts()
      .filter((alert) => this.isVisibleInboxAlert(alert))
      .filter((alert) => this.isAllowedByPreference(alert))
      .map((alert) => alert as AlertListItem);
  }

  get enrichedFilteredAlerts(): AlertListItem[] {
    return this.inboxAlerts.filter((alert) => {
      if (this.selectedFilter === 'ALL') {
        return true;
      }

      if (this.selectedFilter === 'UNREAD') {
        return alert.isUnread;
      }

      return alert.level === this.selectedFilter;
    });
  }

  get visibleAlertsCount(): number {
    return this.enrichedFilteredAlerts.length;
  }

  get visibleUnreadCount(): number {
    return this.enrichedFilteredAlerts.filter((alert) => alert.isUnread).length;
  }

  get visibleCriticalCount(): number {
    return this.enrichedFilteredAlerts.filter((alert) => alert.isCritical).length;
  }

  get hiddenByPreferencesCount(): number {
    const candidates = this.notificationsFacade
      .sortedAlerts()
      .filter((alert) => this.isVisibleInboxAlert(alert));

    return candidates.filter((alert) => !this.isAllowedByPreference(alert)).length;
  }

  get activeFilterLabel(): string {
    const option = this.filterOptions.find((item) => item.value === this.selectedFilter);

    return this.t(option?.labelKey ?? 'alerts.filters.all');
  }

  private isVisibleInboxAlert(alert: Alert): boolean {
    return alert.active && !alert.expired && !alert.silenced;
  }

  private isAllowedByPreference(alert: Alert): boolean {
    const preference = this.notificationsFacade.notificationPreference();

    if (!preference) {
      return true;
    }

    if (!preference.inAppEnabled) {
      return false;
    }

    return (
      preference.allowsSource(alert.sourceType) &&
      this.notificationChannelPolicy.canNotify(preference, alert.level)
    );
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
