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

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './app-time-picker.component.html',
  styleUrls: ['./app-time-picker.component.scss'],
})
export class AppTimePickerComponent implements OnDestroy {
  @ViewChild('timeTrigger') private readonly timeTrigger?: ElementRef<HTMLElement>;
  @ViewChild('timePanel') private readonly timePanel?: ElementRef<HTMLElement>;

  @Input() label = '';
  @Input() value = '00:00';

  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;

  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly repositionTimePanel = () => this.positionTimePanel();

  readonly hours = Array.from({ length: 24 }, (_, index) =>
    String(index).padStart(2, '0')
  );

  readonly minutes = Array.from({ length: 12 }, (_, index) =>
    String(index * 5).padStart(2, '0')
  );

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  get displayValue(): string {
    return this.normalizedValue;
  }

  get selectedHour(): string {
    return this.normalizedValue.slice(0, 2);
  }

  get selectedMinute(): string {
    return this.normalizedValue.slice(3, 5);
  }

  togglePanel(): void {
    if (this.isOpen) {
      this.closePanel();
      return;
    }

    this.openPanel();
  }

  openPanel(): void {
    this.isOpen = true;
    this.scheduleTimePanelSync();
  }

  closePanel(): void {
    this.clearSyncTimer();
    hideFloatingPopover(this.timePanel?.nativeElement);
    this.unbindFloatingListeners();
    this.isOpen = false;
  }

  selectHour(hour: string): void {
    this.emitValue(hour, this.selectedMinute);
  }

  selectMinute(minute: string): void {
    this.emitValue(this.selectedHour, minute);
    this.closePanel();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;

    if (!this.elementRef.nativeElement.contains(target)) {
      this.closePanel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closePanel();
  }

  ngOnDestroy(): void {
    this.clearSyncTimer();
    hideFloatingPopover(this.timePanel?.nativeElement);
    this.unbindFloatingListeners();
  }

  private get normalizedValue(): string {
    if (/^\d{2}:\d{2}$/.test(this.value)) {
      return this.value;
    }

    return '00:00';
  }

  private emitValue(hour: string, minute: string): void {
    const nextValue = `${hour}:${minute}`;

    this.value = nextValue;
    this.valueChange.emit(nextValue);
  }

  private scheduleTimePanelSync(): void {
    this.clearSyncTimer();
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      this.positionTimePanel();
    });
  }

  private positionTimePanel(): void {
    if (!this.isOpen) {
      return;
    }

    const trigger = this.timeTrigger?.nativeElement;
    const panel = this.timePanel?.nativeElement;

    if (!trigger || !panel) {
      return;
    }

    positionFloatingPanel(trigger, panel, {
      maxHeight: 250,
      minHeight: 180,
      minWidth: 172,
      panelHeight: 236,
      preferredWidth: 172,
    });
    showFloatingPopover(panel);
    this.bindFloatingListeners();
  }

  private bindFloatingListeners(): void {
    window.addEventListener('resize', this.repositionTimePanel);
    document.addEventListener('scroll', this.repositionTimePanel, true);
  }

  private unbindFloatingListeners(): void {
    window.removeEventListener('resize', this.repositionTimePanel);
    document.removeEventListener('scroll', this.repositionTimePanel, true);
  }

  private clearSyncTimer(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }
}
