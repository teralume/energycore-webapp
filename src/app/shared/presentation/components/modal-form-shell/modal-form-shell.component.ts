import { TranslateModule } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';

@Component({
  selector: 'app-modal-form-shell',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './modal-form-shell.component.html',
  styleUrls: ['./modal-form-shell.component.scss'],
})
export class ModalFormShellComponent implements OnDestroy {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() description = '';

  @Output() closed = new EventEmitter<void>();

  closing = false;

  private modalOpen = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  @Input()
  set open(value: boolean) {
    this.modalOpen = value;

    if (value) {
      this.clearCloseTimer();
      this.closing = false;
    }
  }

  get open(): boolean {
    return this.modalOpen || this.closing;
  }

  ngOnDestroy(): void {
    this.clearCloseTimer();
  }

  close(): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    this.clearCloseTimer();
    this.closeTimer = setTimeout(() => {
      this.closed.emit();
      this.closing = false;
      this.closeTimer = null;
    }, 180);
  }

  private clearCloseTimer(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }
}
