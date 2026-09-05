import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IamFacade } from '../../../application/services/iam.facade';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { SettingsSectionComponent } from '../../../../shared/presentation/components/settings-section/settings-section.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    TranslateModule,
    FormsModule,
    AppButtonComponent,
    SettingsSectionComponent,
  ],
  templateUrl: './profile-page.component.html',
  styleUrls: ['../settings-page.shared.scss'],
})
export class ProfilePageComponent implements OnInit {
  fullName = '';
  email = '';

  constructor(
    readonly iamFacade: IamFacade,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    const user = this.iamFacade.currentUser();

    if (!user) return;

    this.fullName = user.fullName;
    this.email = user.email;
  }

  async onUpdateProfile(): Promise<void> {
    const success = await this.iamFacade.updateProfile({
      fullName: this.fullName,
      email: this.email,
    });

    if (success) {
      this.toastService.success(this.t('settings.profile.updateSuccess'));
    } else {
      this.toastService.error(this.t('settings.profile.updateError'));
    }
  }

  hasPendingChanges(): boolean {
    const currentUser = this.iamFacade.currentUser();

    if (!currentUser) {
      return false;
    }

    return (
      currentUser.fullName !== this.fullName ||
      currentUser.email !== this.email
    );
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }
}
