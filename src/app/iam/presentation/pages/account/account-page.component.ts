import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';

import { IamFacade } from '../../../application/services/iam.facade';
import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';
import { SettingsSectionComponent } from '../../../../shared/presentation/components/settings-section/settings-section.component';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [
    TranslateModule,SettingsSectionComponent],
  templateUrl: './account-page.component.html',
  styleUrls: ['../settings-page.shared.scss'],
})
export class AccountPageComponent {
  constructor(
    readonly iamFacade: IamFacade,
    private readonly uiPreferences: UiPreferencesService,
    private readonly translate: TranslateService
  ) {}

  get userInitials(): string {
    return this.iamFacade.currentUser()?.initials || 'EC';
  }

  formatDate(value: string | undefined): string {
    if (!value) {
      return this.t('settings.common.notAvailable');
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  currentLocale(): string {
    const localeByLanguage: Record<string, string> = {
      es: 'es-PE',
      en: 'en-US',
      pt: 'pt-BR',
    };

    return localeByLanguage[this.uiPreferences.currentLanguage()] ?? localeByLanguage['es'];
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }
}
