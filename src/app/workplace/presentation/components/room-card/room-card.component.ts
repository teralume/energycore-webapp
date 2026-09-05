import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import { Room } from '../../../domain/model/room.entity';

const localeByLanguage: Record<string, string> = {
  es: 'es-PE',
  en: 'en-US',
  pt: 'pt-BR',
};

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [TranslateModule, AppButtonComponent, SectionCardComponent],
  templateUrl: './room-card.component.html',
  styleUrls: ['./room-card.component.scss'],
})
export class RoomCardComponent {
  @Input({ required: true }) room!: Room;
  @Input() locationName = '';
  @Input() deviceCount = 0;
  @Input() activeDeviceCount = 0;
  @Input() groupCount = 0;
  @Input() routineCount = 0;
  @Input() currentWatts = 0;
  @Input() primaryGroupName = '';

  @Output() remove = new EventEmitter<number>();

  constructor(
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService
  ) {}

  get statusLabel(): string {
    return this.translate.instant(this.statusLabelKey);
  }

  get statusLabelKey(): string {
    if (this.deviceCount === 0) {
      return 'workplace.rooms.status.noDevices';
    }

    if (this.activeDeviceCount > 0) {
      return 'workplace.rooms.status.active';
    }

    return 'workplace.rooms.status.idle';
  }

  get formattedCreatedAt(): string {
    if (!this.room.createdAt) {
      return this.translate.instant('workplace.rooms.card.noDate');
    }

    const date = new Date(this.room.createdAt);

    if (Number.isNaN(date.getTime())) {
      return this.room.createdAt;
    }

    return date.toLocaleDateString(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  onRemove(): void {
    this.remove.emit(this.room.id);
  }

  private currentLocale(): string {
    return localeByLanguage[this.uiPreferences.currentLanguage()] ?? localeByLanguage['es'];
  }
}
