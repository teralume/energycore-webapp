import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SharedUiStore {
  private readonly sidebarOpenSignal = signal<boolean>(false);
  private readonly globalLoadingSignal = signal<boolean>(false);

  readonly sidebarOpen = computed(() => this.sidebarOpenSignal());
  readonly globalLoading = computed(() => this.globalLoadingSignal());

  setSidebarOpen(value: boolean): void {
    this.sidebarOpenSignal.set(value);
  }

  toggleSidebar(): void {
    this.sidebarOpenSignal.update((value) => !value);
  }

  setGlobalLoading(value: boolean): void {
    this.globalLoadingSignal.set(value);
  }

  reset(): void {
    this.sidebarOpenSignal.set(false);
    this.globalLoadingSignal.set(false);
  }
}