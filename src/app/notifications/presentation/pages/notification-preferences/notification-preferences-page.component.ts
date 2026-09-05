import { Component, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NotificationsFacade } from '../../../application/services/notifications.facade';
import { UpdateNotificationPreferenceCommand } from '../../../application/commands/update-notification-preference.command';

import { NotificationPreferenceFormComponent } from '../../components/notification-preference-form/notification-preference-form.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { SettingsSectionComponent } from '../../../../shared/presentation/components/settings-section/settings-section.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';

@Component({
  selector: 'app-notification-preferences-page',
  standalone: true,
  imports: [
    TranslateModule,
    EmptyStateComponent,
    NotificationPreferenceFormComponent,
    LoadingSpinnerComponent,
    SettingsSectionComponent,
    SectionCardComponent,
  ],
  templateUrl: './notification-preferences-page.component.html',
  styleUrls: ['./notification-preferences-page.component.scss'],
})
export class NotificationPreferencesPageComponent implements OnInit {
  constructor(
    readonly notificationsFacade: NotificationsFacade,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.notificationsFacade.loadNotifications();
  }

  async savePreference(command: UpdateNotificationPreferenceCommand): Promise<void> {
    const success = await this.notificationsFacade.updateNotificationPreference(command);

    if (success) {
      this.toastService.success(this.translate.instant('notificationPreferences.updateSuccess'));
    } else {
      this.toastService.error(this.translate.instant('notificationPreferences.updateError'));
    }
  }
}
