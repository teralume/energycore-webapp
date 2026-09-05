// src/app/shared/application/services/ui-state.service.ts

import { Injectable } from '@angular/core';

import { SharedUiStore } from '../stores/shared-ui.store';

@Injectable({
  providedIn: 'root',
})
export class UiStateService {
  constructor(private readonly store: SharedUiStore) {}

  get sidebarOpen() {
    return this.store.sidebarOpen;
  }

  get globalLoading() {
    return this.store.globalLoading;
  }

  openSidebar(): void {
    this.store.setSidebarOpen(true);
  }

  closeSidebar(): void {
    this.store.setSidebarOpen(false);
  }

  toggleSidebar(): void {
    this.store.toggleSidebar();
  }

  setGlobalLoading(value: boolean): void {
    this.store.setGlobalLoading(value);
  }

  reset(): void {
    this.store.reset();
  }
}