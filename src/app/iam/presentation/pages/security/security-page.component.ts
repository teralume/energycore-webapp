import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';

import { ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { IamFacade } from '../../../application/services/iam.facade';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { SettingsSectionComponent } from '../../../../shared/presentation/components/settings-section/settings-section.component';

@Component({
  selector: 'app-security-page',
  standalone: true,
  imports: [
    TranslateModule,
    AppButtonComponent,
    SettingsSectionComponent,
  ],
  templateUrl: './security-page.component.html',
  styleUrls: ['../settings-page.shared.scss'],
})
export class SecurityPageComponent {
  constructor(
    readonly iamFacade: IamFacade,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translate: TranslateService
  ) {}

  get email(): string {
    return this.iamFacade.currentUser()?.email ?? '';
  }

  async sendRecovery(): Promise<void> {
    if (!this.email) {
      this.toastService.error(this.t('settings.security.noRecoveryEmail'));
      return;
    }

    const success = await this.iamFacade.recoverPassword({
      email: this.email,
    });

    if (success) {
      this.toastService.success(this.t('settings.security.recoverySent'));
      return;
    }

    this.toastService.error(this.t('settings.security.recoveryError'));
  }

  async onDeleteAccount(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('settings.security.deleteDialogTitle'),
      message: this.t('settings.security.deleteDialogMessage'),
      detail: this.t('settings.security.deleteDialogDetail'),
      confirmLabel: this.t('settings.security.deleteDialogConfirm'),
      cancelLabel: this.t('settings.security.deleteDialogCancel'),
      tone: 'danger',
      requiredText: 'ELIMINAR',
      requiredTextLabel: this.t('settings.security.requiredTextLabel'),
      requiredTextHint: this.t('settings.security.requiredTextHint'),
    });

    if (!confirmed) {
      return;
    }

    const success = await this.iamFacade.deleteAccount({
      confirmation: 'ELIMINAR',
    });

    if (!success) {
      this.toastService.error(this.t('settings.security.deleteAccountError'));
    }
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }
}
