import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { EnergyMonitoringFacade } from '../../../application/services/energy-monitoring.facade';
import { EnergyReadingsFilterCriteria } from '../../../application/criteria/energy-readings-filter.criteria';
import { EnergyReading } from '../../../domain/model/energy-reading.entity';

import { EnergyFilterFormComponent } from '../../components/energy-filter-form/energy-filter-form.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';

import { AppNumberStepperComponent } from '../../../../shared/presentation/components/app-number-stepper/app-number-stepper.component';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';

import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { WorkplaceFacade } from '../../../../workplace/application/services/workplace.facade';
import { ActiveWorkplaceContextService } from '../../../../workplace/application/services/active-workplace-context.service';
import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';

type HistoryStatusFilter = 'ALL' | 'NORMAL' | 'HIGH';
type HistorySortOption = 'NEWEST' | 'OLDEST' | 'WATTS_DESC' | 'WATTS_ASC' | 'COST_DESC';
type HistoryScope = 'ACTIVE_SEDE' | 'GLOBAL';

@Component({
  selector: 'app-energy-history-page',
  standalone: true,
  imports: [
  FormsModule,
  TranslateModule,
  EnergyFilterFormComponent,
  LoadingSpinnerComponent,
  AppNumberStepperComponent,
  AppButtonComponent,
  AppDropdownComponent,
  EmptyStateComponent,
],
  templateUrl: './energy-history-page.component.html',
  styleUrls: ['./energy-history-page.component.scss'],
})
export class EnergyHistoryPageComponent implements OnInit {
  readonly pageSize = 20;

  readonly deviceNameFilter = signal('');
  readonly deviceIdFilter = signal<number | null>(null);
  readonly readingIdFilter = signal<number | null>(null);
  readonly currentPage = signal(1);
  readonly searchTerm = signal('');
  readonly statusFilter = signal<HistoryStatusFilter>('ALL');
  readonly minWatts = signal<number | null>(null);
  readonly maxWatts = signal<number | null>(null);
  readonly sortOption = signal<HistorySortOption>('NEWEST');
  readonly historyScope = signal<HistoryScope>('ACTIVE_SEDE');

  readonly startDateFilter = signal('');
  readonly endDateFilter = signal('');

  readonly activeLocation = computed(() => {
    const activeLocationId = this.activeWorkplaceContext.activeLocationId();

    if (!activeLocationId) {
      return null;
    }

    return (
      this.workplaceFacade
        .locations()
        .find((location) => location.id === activeLocationId) ?? null
    );
  });

  readonly activeLocationDeviceIds = computed(() => {
    const activeLocationId = this.activeWorkplaceContext.activeLocationId();

    if (!activeLocationId) {
      return new Set<number>();
    }

    const assignedDeviceIds = new Set(
      this.workplaceFacade
        .getCurrentDeviceAssignmentsForLocation(activeLocationId)
        .map((assignment) => assignment.deviceId)
    );

    if (assignedDeviceIds.size > 0) {
      return assignedDeviceIds;
    }

    return new Set(this.energyMonitoringFacade.readings().map((reading) => reading.deviceId));
  });

  readonly historyScopeOptions = computed<DropdownOption[]>(() => [
    {
      label: 'Sede activa',
      labelKey: 'history.scope.active',
      value: 'ACTIVE_SEDE',
      description: this.activeLocation()
        ? this.t('history.scope.activeDescription', {
            site: this.activeLocation()?.name,
          })
        : this.t('history.scope.activeFallbackDescription'),
    },
    {
      label: 'Global',
      labelKey: 'history.scope.global',
      value: 'GLOBAL',
      description: this.t('history.scope.globalDescription'),
    },
  ]);

  readonly historyScopeSummary = computed(() => {
    if (this.historyScope() === 'GLOBAL') {
      return this.t('history.scopeSummary.global');
    }

    const activeLocation = this.activeLocation();

    if (!activeLocation) {
      return this.t('history.scopeSummary.noActiveSite');
    }

    return this.t('history.scopeSummary.activeSite', {
      site: activeLocation.name,
    });
  });

  readonly statusOptions: DropdownOption[] = [
  { label: 'Todos', labelKey: 'history.statusOptions.all', value: 'ALL' },
  { label: 'Normal', labelKey: 'history.statusOptions.normal', value: 'NORMAL' },
  { label: 'Alto', labelKey: 'history.statusOptions.high', value: 'HIGH' },
];

readonly sortOptions: DropdownOption[] = [
  { label: 'Mas recientes', labelKey: 'history.sortOptions.newest', value: 'NEWEST' },
  { label: 'Mas antiguas', labelKey: 'history.sortOptions.oldest', value: 'OLDEST' },
  { label: 'Mayor consumo', labelKey: 'history.sortOptions.wattsDesc', value: 'WATTS_DESC' },
  { label: 'Menor consumo', labelKey: 'history.sortOptions.wattsAsc', value: 'WATTS_ASC' },
  { label: 'Mayor costo', labelKey: 'history.sortOptions.costDesc', value: 'COST_DESC' },
];

  readonly filteredHistoryReadings = computed(() => {
  const startDate = this.startDateFilter();
  const endDate = this.endDateFilter();

  const deviceName = this.normalize(this.deviceNameFilter());
  const deviceId = this.deviceIdFilter();
  const readingId = this.readingIdFilter();
  const status = this.statusFilter();
  const minWatts = this.minWatts();
  const maxWatts = this.maxWatts();
  const sort = this.sortOption();
  const scope = this.historyScope();
  const activeLocationId = this.activeWorkplaceContext.activeLocationId();
  const activeLocationDeviceIds = this.activeLocationDeviceIds();

  return [...this.energyMonitoringFacade.readings()]
    .filter((reading) => {
      const readingDate = this.toInputDate(new Date(reading.recordedAt));

      const matchesStartDate = !startDate || readingDate >= startDate;
      const matchesEndDate = !endDate || readingDate <= endDate;

      const matchesDeviceName =
        !deviceName || this.normalize(reading.deviceName).includes(deviceName);

      const matchesDeviceId =
        deviceId === null || reading.deviceId === deviceId;

      const matchesReadingId =
        readingId === null || reading.id === readingId;

      const matchesStatus =
        status === 'ALL' ||
        (status === 'HIGH' && reading.isHigh) ||
        (status === 'NORMAL' && reading.isNormal);

      const matchesMinWatts =
        minWatts === null || reading.watts >= minWatts;

      const matchesMaxWatts =
        maxWatts === null || reading.watts <= maxWatts;

      const matchesScope =
        scope === 'GLOBAL' ||
        (activeLocationId !== null && activeLocationDeviceIds.has(reading.deviceId));

      return (
        matchesScope &&
        matchesStartDate &&
        matchesEndDate &&
        matchesDeviceName &&
        matchesDeviceId &&
        matchesReadingId &&
        matchesStatus &&
        matchesMinWatts &&
        matchesMaxWatts
      );
    })
    .sort((first, second) => {
      switch (sort) {
        case 'OLDEST':
          return new Date(first.recordedAt).getTime() - new Date(second.recordedAt).getTime();

        case 'WATTS_DESC':
          return second.watts - first.watts;

        case 'WATTS_ASC':
          return first.watts - second.watts;

        case 'COST_DESC':
          return second.estimatedCost - first.estimatedCost;

        case 'NEWEST':
        default:
          return new Date(second.recordedAt).getTime() - new Date(first.recordedAt).getTime();
      }
    });
});

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredHistoryReadings().length / this.pageSize))
  );

  readonly paginatedReadings = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;

    return this.filteredHistoryReadings().slice(start, end);
  });

  readonly pageStart = computed(() => {
    if (this.filteredHistoryReadings().length === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize + 1;
  });

  readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.filteredHistoryReadings().length)
  );

  constructor(
    readonly energyMonitoringFacade: EnergyMonitoringFacade,
    readonly workplaceFacade: WorkplaceFacade,
    private readonly activeWorkplaceContext: ActiveWorkplaceContextService,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.energyMonitoringFacade.loadReadings(),
      this.workplaceFacade.loadWorkplace(),
    ]);

    this.activeWorkplaceContext.ensureActiveLocation(
      this.workplaceFacade.locations()
    );
  }


resetFilter(): void {
  this.startDateFilter.set('');
  this.endDateFilter.set('');
  this.energyMonitoringFacade.resetFilter();
  this.clearAdvancedFilters();
  this.goToFirstPage();
}

  exportCsv(): void {
    const success = this.energyMonitoringFacade.exportCsv({
      fileName: this.historyExportFileName(),
      readings: this.filteredHistoryReadings(),
    });

    if (success) {
      this.toastService.success(this.t('history.toasts.exportSuccess'));
    } else {
      this.toastService.error(this.t('history.toasts.exportError'));
    }
  }

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.goToFirstPage();
  }

  onStatusFilterChange(value: string): void {
  if (!['ALL', 'NORMAL', 'HIGH'].includes(value)) {
    return;
  }

  this.statusFilter.set(value as HistoryStatusFilter);
  this.goToFirstPage();
}

  onMinWattsChange(value: number | null): void {
  this.minWatts.set(value);
  this.goToFirstPage();
}

  onMaxWattsChange(value: number | null): void {
  this.maxWatts.set(value);
  this.goToFirstPage();
}

  onSortOptionChange(value: string): void {
  if (!['NEWEST', 'OLDEST', 'WATTS_DESC', 'WATTS_ASC', 'COST_DESC'].includes(value)) {
    return;
  }

  this.sortOption.set(value as HistorySortOption);
  this.goToFirstPage();
}

  onHistoryScopeChange(value: string): void {
  if (!['ACTIVE_SEDE', 'GLOBAL'].includes(value)) {
    return;
  }

  this.historyScope.set(value as HistoryScope);
  this.goToFirstPage();
}

  clearAdvancedFilters(): void {
  this.deviceNameFilter.set('');
  this.deviceIdFilter.set(null);
  this.readingIdFilter.set(null);
  this.statusFilter.set('ALL');
  this.minWatts.set(null);
  this.maxWatts.set(null);
  this.sortOption.set('NEWEST');
  this.goToFirstPage();
}

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((page) => page + 1);
    }
  }

  goToFirstPage(): void {
    this.currentPage.set(1);
  }

  onDeviceNameFilterChange(value: string): void {
  this.deviceNameFilter.set(value);
  this.goToFirstPage();
}

onDeviceIdFilterChange(value: number | null): void {
  this.deviceIdFilter.set(value);
  this.goToFirstPage();
}

onReadingIdFilterChange(value: number | null): void {
  this.readingIdFilter.set(value);
  this.goToFirstPage();
}

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return this.t('history.emptyValues.noDate');
    }

    return new Intl.DateTimeFormat(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  formatTime(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return this.t('history.emptyValues.noTime');
    }

    return new Intl.DateTimeFormat(this.currentLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  formatWatts(value: number): string {
    return `${new Intl.NumberFormat(this.currentLocale(), {
      maximumFractionDigits: 2,
    }).format(value)} W`;
  }

  formatKilowattHours(value: number): string {
    return `${new Intl.NumberFormat(this.currentLocale(), {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(value)} kWh`;
  }

  formatEstimatedCost(value: number): string {
    return `S/ ${new Intl.NumberFormat(this.currentLocale(), {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value)}`;
  }

  formatSampleSeconds(value: number): string {
    if (!value || value <= 0) {
      return this.t('history.emptyValues.undefined');
    }

    if (value < 60) {
      return `${value} s`;
    }

    const minutes = value / 60;

    return `${new Intl.NumberFormat(this.currentLocale(), {
      maximumFractionDigits: 1,
    }).format(minutes)} min`;
  }

  readingMeta(reading: EnergyReading): string {
    return this.t('history.readingMeta', {
      deviceId: reading.deviceId,
      readingId: reading.id,
    });
  }

  readingStatusLabel(reading: EnergyReading): string {
    return reading.isHigh
      ? this.t('history.statusOptions.high')
      : this.t('history.statusOptions.normal');
  }

  trackReading(_: number, reading: EnergyReading): number {
    return reading.id;
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  onDateRangeChange(criteria: EnergyReadingsFilterCriteria): void {
  this.startDateFilter.set(criteria.startDate);
  this.endDateFilter.set(criteria.endDate);
  this.goToFirstPage();
}

private toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

private historyExportFileName(): string {
  if (this.historyScope() === 'GLOBAL') {
    return 'energycore-energy-history-global';
  }

  const locationName = this.activeLocation()?.name ?? 'sede-activa';

  return `energycore-energy-history-${this.normalizeForFileName(locationName)}`;
}

private normalizeForFileName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

private t(key: string, params?: Record<string, unknown>): string {
  this.uiPreferences.currentLanguage();

  return this.translate.instant(key, params);
}

private currentLocale(): string {
  const localeByLanguage = {
    es: 'es-PE',
    en: 'en-US',
    pt: 'pt-BR',
  };

  return localeByLanguage[this.uiPreferences.currentLanguage()];
}
}
