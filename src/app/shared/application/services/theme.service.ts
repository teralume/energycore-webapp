import { Injectable, computed, inject } from '@angular/core';

import { AppTheme, UiPreferencesService } from './ui-preferences.service';

export type { AppTheme };

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly uiPreferences = inject(UiPreferencesService);

  readonly currentTheme = computed<AppTheme>(() => this.uiPreferences.isDarkMode() ? 'dark' : 'light');
  readonly isDarkMode = computed(() => this.uiPreferences.isDarkMode());

  toggleTheme(): void {
    this.uiPreferences.toggleTheme();
  }

  setTheme(theme: AppTheme): void {
    this.uiPreferences.setTheme(theme);
  }
}
