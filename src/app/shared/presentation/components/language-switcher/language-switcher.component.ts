import { TranslateModule } from '@ngx-translate/core';
import { Component } from '@angular/core';

import { UiPreferencesService } from '../../../application/services/ui-preferences.service';

type LanguageOption = {
  code: 'es' | 'en' | 'pt';
  label: string;
};

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [
    TranslateModule,],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss'],
})
export class LanguageSwitcherComponent {
  readonly languages: LanguageOption[] = [
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
    { code: 'pt', label: 'PT' },
  ];

  constructor(readonly uiPreferences: UiPreferencesService) {}

  changeLanguage(language: LanguageOption['code']): void {
    this.uiPreferences.setLanguage(language);
  }
}