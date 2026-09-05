import { TranslateModule } from '@ngx-translate/core';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

import {
  hideFloatingPopover,
  positionFloatingPanel,
  showFloatingPopover,
} from '../../utils/floating-panel-position';
import { UiPreferencesService } from '../../../application/services/ui-preferences.service';

interface CalendarDay {
  day: number;
  value: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './app-date-picker.component.html',
  styleUrls: ['./app-date-picker.component.scss'],
})
export class AppDatePickerComponent implements OnDestroy {
  @ViewChild('dateTrigger') private readonly dateTrigger?: ElementRef<HTMLElement>;
  @ViewChild('calendarPanel') private readonly calendarPanel?: ElementRef<HTMLElement>;

  @Input() label = '';
  @Input() value = '';
  @Input() min = '';
  @Input() max = '';

  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  isClosing = false;

  visibleYear = new Date().getFullYear();
  visibleMonth = new Date().getMonth();

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly repositionCalendar = () => this.positionCalendar();

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly uiPreferences: UiPreferencesService
  ) {}

  get displayValue(): string {
    if (!this.value) {
      return '';
    }

    const date = this.fromInputDate(this.value);

    return new Intl.DateTimeFormat(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  get currentMonthLabel(): string {
    const label = new Intl.DateTimeFormat(this.currentLocale(), {
      month: 'long',
      year: 'numeric',
    }).format(new Date(this.visibleYear, this.visibleMonth, 1));

    return this.capitalize(label);
  }

  get weekDays(): string[] {
    const formatter = new Intl.DateTimeFormat(this.currentLocale(), {
      weekday: 'short',
    });
    const sunday = new Date(2026, 5, 7);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + index);

      return formatter
        .format(date)
        .replace('.', '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .slice(0, 2)
        .toUpperCase();
    });
  }

  get shouldRenderCalendar(): boolean {
    return this.isOpen || this.isClosing;
  }

  get days(): CalendarDay[] {
    const firstDayOfMonth = new Date(this.visibleYear, this.visibleMonth, 1);
    const calendarStart = new Date(firstDayOfMonth);

    calendarStart.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + index);

      const value = this.toInputDate(date);

      return {
        day: date.getDate(),
        value,
        isCurrentMonth: date.getMonth() === this.visibleMonth,
        isToday: value === this.toInputDate(new Date()),
        isSelected: value === this.value,
        isDisabled: this.isDisabled(value),
      };
    });
  }

  toggleCalendar(): void {
    if (this.isOpen) {
      this.closeCalendar();
      return;
    }

    this.openCalendar();
  }

  openCalendar(): void {
    this.clearCloseTimer();
    this.isClosing = false;
    this.isOpen = true;
    this.syncVisibleMonth();
    this.scheduleCalendarSync();
  }

  closeCalendar(): void {
    if (!this.isOpen || this.isClosing) {
      return;
    }

    this.isClosing = true;
    this.clearCloseTimer();
    this.closeTimer = setTimeout(() => {
      hideFloatingPopover(this.calendarPanel?.nativeElement);
      this.unbindFloatingListeners();
      this.isOpen = false;
      this.isClosing = false;
      this.closeTimer = null;
    }, 170);
  }

  previousMonth(): void {
    if (this.visibleMonth === 0) {
      this.visibleMonth = 11;
      this.visibleYear--;
      return;
    }

    this.visibleMonth--;
  }

  nextMonth(): void {
    if (!this.canGoNextMonth()) {
      return;
    }

    if (this.visibleMonth === 11) {
      this.visibleMonth = 0;
      this.visibleYear++;
      return;
    }

    this.visibleMonth++;
  }

  selectDate(day: CalendarDay): void {
    if (day.isDisabled) {
      return;
    }

    this.value = day.value;
    this.valueChange.emit(day.value);
    this.closeCalendar();
  }

  selectToday(): void {
    const today = this.toInputDate(new Date());

    if (this.isDisabled(today)) {
      return;
    }

    this.value = today;
    this.valueChange.emit(today);
    this.syncVisibleMonth();
    this.closeCalendar();
  }

  clear(): void {
    this.value = '';
    this.valueChange.emit('');
    this.closeCalendar();
  }

  canGoNextMonth(): boolean {
    if (!this.max) {
      return true;
    }

    const nextMonth = this.visibleMonth === 11 ? 0 : this.visibleMonth + 1;
    const nextYear = this.visibleMonth === 11 ? this.visibleYear + 1 : this.visibleYear;
    const firstDayOfNextMonth = this.toInputDate(new Date(nextYear, nextMonth, 1));

    return firstDayOfNextMonth <= this.max;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;

    if (!this.elementRef.nativeElement.contains(target)) {
      this.closeCalendar();
    }
  }

  ngOnDestroy(): void {
    this.clearCloseTimer();
    this.clearSyncTimer();
    hideFloatingPopover(this.calendarPanel?.nativeElement);
    this.unbindFloatingListeners();
  }

  private syncVisibleMonth(): void {
    const baseDate = this.value ? this.fromInputDate(this.value) : new Date();

    this.visibleYear = baseDate.getFullYear();
    this.visibleMonth = baseDate.getMonth();
  }

  private isDisabled(value: string): boolean {
    if (this.min && value < this.min) {
      return true;
    }

    if (this.max && value > this.max) {
      return true;
    }

    return false;
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private fromInputDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  private currentLocale(): string {
    const localeByLanguage = {
      es: 'es-PE',
      en: 'en-US',
      pt: 'pt-BR',
    };

    return localeByLanguage[this.uiPreferences.currentLanguage()];
  }

  private capitalize(value: string): string {
    if (!value) {
      return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private clearCloseTimer(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private scheduleCalendarSync(): void {
    this.clearSyncTimer();
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      this.positionCalendar();
    });
  }

  private positionCalendar(): void {
    if (!this.shouldRenderCalendar) {
      return;
    }

    const trigger = this.dateTrigger?.nativeElement;
    const panel = this.calendarPanel?.nativeElement;

    if (!trigger || !panel) {
      return;
    }

    positionFloatingPanel(trigger, panel, {
      maxHeight: 420,
      minHeight: 320,
      minWidth: 292,
      panelHeight: 386,
      preferredWidth: 330,
    });
    showFloatingPopover(panel);
    this.bindFloatingListeners();
  }

  private bindFloatingListeners(): void {
    window.addEventListener('resize', this.repositionCalendar);
    document.addEventListener('scroll', this.repositionCalendar, true);
  }

  private unbindFloatingListeners(): void {
    window.removeEventListener('resize', this.repositionCalendar);
    document.removeEventListener('scroll', this.repositionCalendar, true);
  }

  private clearSyncTimer(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }
}
