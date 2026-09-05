import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';

import { ToastService } from '../../../../shared/application/services/toast.service';
import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { SettingsSectionComponent } from '../../../../shared/presentation/components/settings-section/settings-section.component';
import { SettingToggleComponent } from '../../../../shared/presentation/components/setting-toggle/setting-toggle.component';

@Component({
  selector: 'app-platform-page',
  standalone: true,
  imports: [
    TranslateModule,
    AppDropdownComponent,
    SettingsSectionComponent,
    SettingToggleComponent,
  ],
  templateUrl: './platform-page.component.html',
  styleUrls: ['../settings-page.shared.scss'],
})
export class PlatformPageComponent {
  readonly languageOptions: DropdownOption[] = [
    {
      label: 'Espanol',
      labelKey: 'settings.platform.languages.es',
      value: 'es',
      descriptionKey: 'settings.platform.languages.esDescription',
    },
    {
      label: 'English',
      labelKey: 'settings.platform.languages.en',
      value: 'en',
      descriptionKey: 'settings.platform.languages.enDescription',
    },
    {
      label: 'Portugues',
      labelKey: 'settings.platform.languages.pt',
      value: 'pt',
      descriptionKey: 'settings.platform.languages.ptDescription',
    },
  ];

  constructor(
    readonly uiPreferences: UiPreferencesService,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService
  ) {}

  get currentLanguage(): string {
    return this.uiPreferences.currentLanguage();
  }

  get currentLanguageLabel(): string {
    const option = this.languageOptions.find((item) => item.value === this.currentLanguage);

    return option?.labelKey ? this.t(option.labelKey) : option?.label ?? this.currentLanguage;
  }

  get currentThemeLabel(): string {
    return this.uiPreferences.isDarkMode()
      ? this.t('settings.platform.darkMode')
      : this.t('settings.platform.lightMode');
  }

  selectLanguage(value: string): void {
    if (value !== 'es' && value !== 'en' && value !== 'pt') {
      return;
    }

    this.uiPreferences.setLanguage(value);
    this.toastService.info(this.t('settings.platform.languageApplied'));
  }

  setDarkMode(enabled: boolean): void {
    if (this.uiPreferences.isDarkMode() === enabled) {
      return;
    }

    this.uiPreferences.toggleTheme();
    this.toastService.info(this.t('settings.platform.appearanceApplied'));
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }
}
