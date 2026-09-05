import { Injectable, computed, signal } from '@angular/core';

import { STORAGE_KEYS } from '../../../shared/infrastructure/constants/storage-keys';
import { Location } from '../../domain/model/location.entity';

@Injectable({
  providedIn: 'root',
})
export class ActiveWorkplaceContextService {
  private readonly activeLocationIdSignal = signal<number | null>(
    this.restoreActiveLocationId()
  );
  private readonly locationsSignal = signal<Location[]>([]);

  readonly activeLocationId = computed(() => this.activeLocationIdSignal());
  readonly activeLocation = computed(() => {
    const activeId = this.activeLocationIdSignal();

    if (!activeId) {
      return null;
    }

    return this.locationsSignal().find((location) => location.id === activeId) ?? null;
  });

  setActiveLocation(locationId: number | null): void {
    if (!locationId || !Number.isFinite(locationId)) {
      this.clearActiveLocation();
      return;
    }

    this.activeLocationIdSignal.set(locationId);
    localStorage.setItem(STORAGE_KEYS.activeWorkplaceId, String(locationId));
  }

  clearActiveLocation(): void {
    this.activeLocationIdSignal.set(null);
    localStorage.removeItem(STORAGE_KEYS.activeWorkplaceId);
  }

  ensureActiveLocation(locations: Location[]): Location | null {
    this.locationsSignal.set(locations);

    if (locations.length === 0) {
      this.clearActiveLocation();
      return null;
    }

    const activeId = this.activeLocationIdSignal();
    const current = activeId
      ? locations.find((location) => location.id === activeId)
      : null;

    if (current) {
      return current;
    }

    const fallback = locations[0];
    this.setActiveLocation(fallback.id);
    return fallback;
  }

  private restoreActiveLocationId(): number | null {
    const rawValue = localStorage.getItem(STORAGE_KEYS.activeWorkplaceId);

    if (!rawValue) {
      return null;
    }

    const parsed = Number(rawValue);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}
