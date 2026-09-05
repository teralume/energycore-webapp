import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../../infrastructure/constants/app-language';
import { STORAGE_KEYS } from '../../infrastructure/constants/storage-keys';
import { UiPreferencesApiService } from '../../infrastructure/api/ui-preferences-api.service';

type LanguageCode = 'es' | 'en' | 'pt';
export type AppTheme = 'light' | 'dark';

const LEGACY_LANGUAGE_KEY = 'energycore_language';
const LEGACY_THEME_KEY = 'energycore_theme';

@Injectable({
  providedIn: 'root',
})
export class UiPreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);
  private readonly uiPreferencesApi = inject(UiPreferencesApiService);
  private readonly storage = this.document.defaultView?.localStorage;

  readonly currentLanguage = signal<LanguageCode>(this.readStoredLanguage());

  readonly isDarkMode = signal(this.readStoredTheme() === 'dark');

  constructor() {
    this.translate.addLangs(SUPPORTED_LANGUAGES);
    this.translate.setFallbackLang(DEFAULT_LANGUAGE);
    this.translate.use(this.currentLanguage());

    effect(() => {
      const language = this.currentLanguage();
      this.writeStorage(STORAGE_KEYS.language, language);
      this.writeStorage(LEGACY_LANGUAGE_KEY, language);
      this.translate.use(language);
      this.persistRemotePreferences();
    });

    effect(() => {
      const darkMode = this.isDarkMode();
      this.applyTheme(darkMode ? 'dark' : 'light');
      this.persistRemotePreferences();
    });

    void this.loadRemotePreferences();
  }

  setLanguage(language: LanguageCode): void {
    this.currentLanguage.set(language);
  }

  toggleLanguage(): void {
    const current = this.currentLanguage();

    const nextLanguage: LanguageCode = current === 'es' ? 'en' : current === 'en' ? 'pt' : 'es';

    this.setLanguage(nextLanguage);
  }

  toggleTheme(): void {
    this.isDarkMode.update((value) => !value);
  }

  setTheme(theme: AppTheme): void {
    this.isDarkMode.set(theme === 'dark');
  }

  private applyTheme(theme: AppTheme): void {
    const root = this.document.documentElement;

    root.classList.remove('light-theme', 'dark-theme');
    root.classList.add(`${theme}-theme`);
    root.dataset['theme'] = theme;
    root.style.colorScheme = theme;

    this.writeStorage(LEGACY_THEME_KEY, theme);
    this.writeStorage(STORAGE_KEYS.darkMode, String(theme === 'dark'));
  }

  private async loadRemotePreferences(): Promise<void> {
    try {
      const preference = await firstValueFrom(this.uiPreferencesApi.getCurrent());
      if (this.isSupportedLanguage(preference.language)) {
        this.currentLanguage.set(preference.language);
      }
      this.setTheme(preference.theme);
    } catch {
      return;
    }
  }

  private persistRemotePreferences(): void {
    void firstValueFrom(
      this.uiPreferencesApi.save({
        language: this.currentLanguage(),
        theme: this.isDarkMode() ? 'dark' : 'light',
      }),
    ).catch(() => undefined);
  }

  private readStoredLanguage(): LanguageCode {
    const storedLanguage =
      this.readStorage(STORAGE_KEYS.language) ?? this.readStorage(LEGACY_LANGUAGE_KEY);

    return this.isSupportedLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
  }

  private readStoredTheme(): AppTheme {
    const storedTheme = this.readStorage(LEGACY_THEME_KEY);

    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    const storedDarkMode = this.readStorage(STORAGE_KEYS.darkMode);

    if (storedDarkMode === 'false') {
      return 'light';
    }

    if (storedDarkMode === 'true') {
      return 'dark';
    }

    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  private isSupportedLanguage(language: string | null): language is LanguageCode {
    return SUPPORTED_LANGUAGES.includes(language as LanguageCode);
  }

  private readStorage(key: string): string | null {
    try {
      return this.storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      this.storage?.setItem(key, value);
    } catch {
      return;
    }
  }
}
