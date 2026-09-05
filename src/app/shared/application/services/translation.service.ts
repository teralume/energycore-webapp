// src/app/shared/application/services/translation.service.ts

import { Injectable, computed, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  APP_LANGUAGES,
  AppLanguageCode,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from '../../infrastructure/constants/app-language';

export type AppLanguage = AppLanguageCode;

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly currentLanguageSignal = signal<AppLanguage>(DEFAULT_LANGUAGE);

  readonly currentLanguage = computed(() => this.currentLanguageSignal());

  readonly availableLanguages = SUPPORTED_LANGUAGES;

  constructor(private readonly translate: TranslateService) {
    this.translate.addLangs(SUPPORTED_LANGUAGES);
    this.translate.setDefaultLang(DEFAULT_LANGUAGE);
    this.use(DEFAULT_LANGUAGE);
  }

  use(language: AppLanguage): void {
    const nextLanguage = this.availableLanguages.includes(language)
      ? language
      : DEFAULT_LANGUAGE;

    this.currentLanguageSignal.set(nextLanguage);
    this.translate.use(nextLanguage);
  }

  toggleLanguage(): void {
    const current = this.currentLanguageSignal();

    if (current === APP_LANGUAGES.ES) {
      this.use(APP_LANGUAGES.EN);
      return;
    }

    if (current === APP_LANGUAGES.EN) {
      this.use(APP_LANGUAGES.PT);
      return;
    }

    this.use(APP_LANGUAGES.ES);
  }
}