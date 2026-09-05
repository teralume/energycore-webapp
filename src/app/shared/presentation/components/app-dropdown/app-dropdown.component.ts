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
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import {
  hideFloatingPopover,
  positionFloatingPanel,
  showFloatingPopover,
} from '../../utils/floating-panel-position';
import { DropdownOption } from './dropdown-option.model';

export type DropdownTone = 'default' | 'info' | 'success' | 'warning' | 'critical';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './app-dropdown.component.html',
  styleUrls: ['./app-dropdown.component.scss'],
})
export class AppDropdownComponent implements OnDestroy {
  @ViewChild('dropdownTrigger') private readonly dropdownTrigger?: ElementRef<HTMLElement>;
  @ViewChild('dropdownMenu') private readonly dropdownMenu?: ElementRef<HTMLElement>;

  @Input() options: DropdownOption[] = [];
  @Input() value: string | null = null;
  @Input() placeholder = 'Seleccionar';
  @Input() triggerLabel = '';
  @Input() variant: 'field' | 'nav' = 'field';
  @Input() tone: DropdownTone = 'default';

  @Output() valueChange = new EventEmitter<string>();
  @Output() selected = new EventEmitter<DropdownOption>();

  isOpen = false;
  isClosing = false;

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly repositionFloatingMenu = () => this.positionFloatingMenu();

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  get isNavVariant(): boolean {
    return this.variant === 'nav';
  }

  get selectedOption(): DropdownOption | undefined {
    return this.options.find((option) => option.value === this.value);
  }

  get labelToShow(): string {
    if (this.triggerLabel) {
      return this.triggerLabel;
    }

    return this.selectedOption?.label ?? this.placeholder;
  }

  get selectedLabelKey(): string | null {
    if (this.triggerLabel) {
      return null;
    }

    return this.selectedOption?.labelKey ?? null;
  }

  get shouldRenderMenu(): boolean {
    return this.isOpen || this.isClosing;
  }

  toggleDropdown(): void {
    if (this.isNavVariant) {
      return;
    }

    if (this.isOpen) {
      this.closeDropdown();
      return;
    }

    this.openDropdown();
  }

  openDropdown(): void {
    this.clearCloseTimer();
    this.isClosing = false;
    this.isOpen = true;
    this.scheduleFloatingMenuSync();
  }

  closeDropdown(): void {
    if (!this.isOpen || this.isClosing) {
      return;
    }

    this.isClosing = true;
    this.isOpen = false;
    this.clearCloseTimer();
    this.closeTimer = setTimeout(() => {
      hideFloatingPopover(this.dropdownMenu?.nativeElement);
      this.unbindFloatingListeners();
      this.isClosing = false;
      this.closeTimer = null;
    }, 180);
  }

  selectOption(option: DropdownOption): void {
    if (option.disabled) {
      return;
    }

    this.valueChange.emit(option.value);
    this.selected.emit(option);
    this.closeDropdown();
  }

  onNavMouseEnter(): void {
    if (this.isNavVariant) {
      this.openDropdown();
    }
  }

  onNavMouseLeave(event: MouseEvent): void {
    const nextTarget = event.relatedTarget as Node | null;

    if (this.isNavVariant && (!nextTarget || !this.elementRef.nativeElement.contains(nextTarget))) {
      this.closeDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (this.isNavVariant) {
      return;
    }

    const target = event.target as Node;

    if (!this.elementRef.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.closeDropdown();
  }

  ngOnDestroy(): void {
    this.clearCloseTimer();
    this.clearSyncTimer();
    hideFloatingPopover(this.dropdownMenu?.nativeElement);
    this.unbindFloatingListeners();
  }

  private clearCloseTimer(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private scheduleFloatingMenuSync(): void {
    this.clearSyncTimer();
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      this.positionFloatingMenu();
    });
  }

  private positionFloatingMenu(): void {
    if (!this.shouldRenderMenu) {
      return;
    }

    const trigger = this.dropdownTrigger?.nativeElement;
    const panel = this.dropdownMenu?.nativeElement;

    if (!trigger || !panel) {
      return;
    }

    if (this.isNavVariant) {
      return;
    }

    const estimatedHeight = Math.min(360, 16 + this.options.length * (this.isNavVariant ? 46 : 58));

    positionFloatingPanel(trigger, panel, {
      maxHeight: 360,
      minHeight: 120,
      minWidth: 180,
      panelHeight: estimatedHeight,
    });
    showFloatingPopover(panel);
    this.bindFloatingListeners();
  }

  private bindFloatingListeners(): void {
    window.addEventListener('resize', this.repositionFloatingMenu);
    document.addEventListener('scroll', this.repositionFloatingMenu, true);
  }

  private unbindFloatingListeners(): void {
    window.removeEventListener('resize', this.repositionFloatingMenu);
    document.removeEventListener('scroll', this.repositionFloatingMenu, true);
  }

  private clearSyncTimer(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }
}
