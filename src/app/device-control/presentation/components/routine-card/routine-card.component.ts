import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { Routine, RoutineAction, RoutineTargetType } from '../../../domain/model/routine.entity';

type RoutinePowerTransition = 'activating' | 'deactivating' | null;

const localeByLanguage: Record<string, string> = {
  es: 'es-PE',
  en: 'en-US',
  pt: 'pt-BR',
};

@Component({
  selector: 'app-routine-card',
  standalone: true,
  imports: [TranslateModule, AppButtonComponent],
  templateUrl: './routine-card.component.html',
  styleUrls: ['./routine-card.component.scss'],
})
export class RoutineCardComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) routine!: Routine;
  @Input() removing = false;

  @Output() toggle = new EventEmitter<Routine>();
  @Output() remove = new EventEmitter<number>();

  powerTransition: RoutinePowerTransition = null;

  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const routineChange = changes['routine'];
    const previous = routineChange?.previousValue as Routine | undefined;
    const current = routineChange?.currentValue as Routine | undefined;

    if (
      !previous ||
      !current ||
      previous.id !== current.id ||
      previous.enabled === current.enabled
    ) {
      return;
    }

    this.playPowerTransition(current.enabled ? 'activating' : 'deactivating');
  }

  ngOnDestroy(): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
  }

  get targetName(): string {
    return this.routine.targetName || `#${this.routine.targetId}`;
  }

  get repeatDisplay(): string {
    if (this.routine.repeatType === 'ONCE') {
      return this.routine.startsOn
        ? this.t('routines.card.onceWithDate', { date: this.formatDate(this.routine.startsOn) })
        : this.t('routines.repeat.once');
    }

    if (this.routine.repeatType === 'WEEKLY') {
      return this.formatWeekDays();
    }

    if (this.routine.repeatType === 'CUSTOM_INTERVAL') {
      return this.t('routines.card.everyDays', { count: this.routine.intervalDays });
    }

    return this.t('routines.repeat.daily');
  }

  get waitingLabel(): string {
    if (!this.routine.enabled) {
      return this.pausedLabel();
    }

    if (this.routine.repeatType === 'ONCE') {
      return this.routine.startsOn
        ? this.t('routines.card.waitingOnceDate', {
          date: this.formatDate(this.routine.startsOn),
          time: this.routine.time,
        })
        : this.t('routines.card.waitingOnce', { time: this.routine.time });
    }

    if (this.routine.repeatType === 'WEEKLY') {
      return this.t('routines.card.waitingWeekly', {
        days: this.weekDaysText(),
        time: this.routine.time,
      });
    }

    if (this.routine.repeatType === 'CUSTOM_INTERVAL') {
      return this.t('routines.card.waitingInterval', {
        count: this.routine.intervalDays,
        time: this.routine.time,
      });
    }

    return this.t('routines.card.waitingDaily', { time: this.routine.time });
  }

  get statusLabelKey(): string {
    return this.routine.enabled ? 'routines.status.active' : 'routines.status.paused';
  }

  get actionLabelKey(): string {
    return this.getActionLabelKey(this.routine.action);
  }

  get targetTypeLabelKey(): string {
    return this.getTargetTypeLabelKey(this.routine.targetType);
  }

  get toggleLabelKey(): string {
    return this.routine.enabled ? 'routines.disable' : 'routines.enable';
  }

  onToggle(): void {
    if (this.removing) {
      return;
    }

    this.toggle.emit(this.routine);
  }

  onRemove(): void {
    if (this.removing) {
      return;
    }

    this.remove.emit(this.routine.id);
  }

  private playPowerTransition(state: Exclude<RoutinePowerTransition, null>): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }

    this.powerTransition = state;
    this.transitionTimer = setTimeout(() => {
      this.powerTransition = null;
      this.transitionTimer = null;
    }, 760);
  }

  private pausedLabel(): string {
    if (this.routine.repeatType === 'ONCE' && this.routine.startsOn) {
      return this.t('routines.card.pausedOnceDate', {
        date: this.formatDate(this.routine.startsOn),
      });
    }

    if (this.routine.repeatType === 'WEEKLY') {
      return this.t('routines.card.pausedWeekly');
    }

    if (this.routine.repeatType === 'CUSTOM_INTERVAL') {
      return this.t('routines.card.pausedInterval');
    }

    return this.t('routines.card.pausedDaily');
  }

  private formatWeekDays(): string {
    if (!this.routine.daysOfWeek) {
      return this.t('routines.repeat.weekly');
    }

    const labels: Record<string, string> = {
      MON: this.t('routines.weekDays.monShort'),
      TUE: this.t('routines.weekDays.tueShort'),
      WED: this.t('routines.weekDays.wedShort'),
      THU: this.t('routines.weekDays.thuShort'),
      FRI: this.t('routines.weekDays.friShort'),
      SAT: this.t('routines.weekDays.satShort'),
      SUN: this.t('routines.weekDays.sunShort'),
    };

    const days = this.routine.daysOfWeek
      .split(',')
      .map((day) => labels[day.trim()] ?? day.trim())
      .filter(Boolean);

    return days.length > 0
      ? this.t('routines.card.weeklyWithDays', { days: days.join(', ') })
      : this.t('routines.repeat.weekly');
  }

  private weekDaysText(): string {
    if (!this.routine.daysOfWeek) {
      return this.t('routines.card.weeklyGeneric');
    }

    const labels: Record<string, string> = {
      MON: this.t('routines.weekDays.monShort'),
      TUE: this.t('routines.weekDays.tueShort'),
      WED: this.t('routines.weekDays.wedShort'),
      THU: this.t('routines.weekDays.thuShort'),
      FRI: this.t('routines.weekDays.friShort'),
      SAT: this.t('routines.weekDays.satShort'),
      SUN: this.t('routines.weekDays.sunShort'),
    };

    const days = this.routine.daysOfWeek
      .split(',')
      .map((day) => labels[day.trim()] ?? day.trim())
      .filter(Boolean);

    return days.length > 0
      ? this.t('routines.card.weeklyDaysText', { days: days.join(', ') })
      : this.t('routines.card.weeklyGeneric');
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');

    if (!year || !month || !day) {
      return value;
    }

    const date = new Date(`${year}-${month}-${day}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private getActionLabelKey(action: RoutineAction): string {
    return action === 'TURN_ON'
      ? 'routines.actions.turnOn'
      : 'routines.actions.turnOff';
  }

  private getTargetTypeLabelKey(targetType: RoutineTargetType): string {
    const labels: Record<RoutineTargetType, string> = {
      DEVICE: 'routines.targetTypes.device',
      GROUP: 'routines.targetTypes.group',
      ROOM: 'routines.targetTypes.room',
      WORKPLACE: 'routines.targetTypes.workplace',
    };

    return labels[targetType];
  }

  private currentLocale(): string {
    return localeByLanguage[this.uiPreferences.currentLanguage()] ?? localeByLanguage['es'];
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
