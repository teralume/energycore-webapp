import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import { Location, LocationType } from '../../../domain/model/location.entity';

const localeByLanguage: Record<string, string> = {
  es: 'es-PE',
  en: 'en-US',
  pt: 'pt-BR',
};

@Component({
  selector: 'app-location-card',
  standalone: true,
  imports: [TranslateModule, AppButtonComponent, SectionCardComponent],
  templateUrl: './location-card.component.html',
  styleUrls: ['./location-card.component.scss'],
})
export class LocationCardComponent {
  @Input({ required: true }) location!: Location;
  @Input() deviceCount = 0;
  @Input() roomCount = 0;
  @Input() groupCount = 0;
  @Input() unroomedDeviceCount = 0;
  @Input() activeWatts = 0;
  @Input() coverage = 0;

  @Output() selected = new EventEmitter<number>();
  @Output() remove = new EventEmitter<number>();

  constructor(
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService
  ) {}

  get typeLabel(): string {
    return this.translate.instant(this.typeLabelKey);
  }

  get typeLabelKey(): string {
    const labels: Record<LocationType, string> = {
      HOME: 'workplace.locationTypes.home',
      BUSINESS: 'workplace.locationTypes.business',
      BRANCH: 'workplace.locationTypes.branch',
    };

    return labels[this.location.type] ?? this.location.type;
  }

  get formattedCreatedAt(): string {
    if (!this.location.createdAt) {
      return this.translate.instant('workplace.locations.card.noDate');
    }

    const date = new Date(this.location.createdAt);

    if (Number.isNaN(date.getTime())) {
      return this.location.createdAt;
    }

    return date.toLocaleDateString(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  onOpen(): void {
    this.selected.emit(this.location.id);
  }

  onRemove(): void {
    this.remove.emit(this.location.id);
  }

  private currentLocale(): string {
    return localeByLanguage[this.uiPreferences.currentLanguage()] ?? localeByLanguage['es'];
  }
}
