import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';

import { ConfirmDialogTone } from '../../../application/services/confirm-dialog.service';
import { AppButtonComponent, AppButtonVariant } from '../app-button/app-button.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [AppButtonComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() title = 'Confirmar accion';
  @Input() message = '';
  @Input() detail?: string;
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() tone: ConfirmDialogTone = 'warning';
  @Input() requiredText?: string;
  @Input() requiredTextLabel?: string;
  @Input() requiredTextHint?: string;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  closing = false;
  confirmationText = '';

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  get confirmVariant(): AppButtonVariant {
    return this.tone === 'danger' ? 'danger' : 'action';
  }

  get requiresTypedConfirmation(): boolean {
    return Boolean(this.requiredText);
  }

  get canConfirm(): boolean {
    return !this.requiredText || this.confirmationText === this.requiredText;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) {
      return;
    }

    const opened = changes['open']?.currentValue === true;
    const contentChanged = Boolean(
      changes['title'] ||
      changes['message'] ||
      changes['detail'] ||
      changes['requiredText']
    );

    if (opened || contentChanged) {
      this.resetDialogState();
    }
  }

  ngOnDestroy(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
  }

  confirm(): void {
    if (!this.canConfirm) {
      return;
    }

    this.close(() => this.confirmed.emit());
  }

  onConfirmationTextInput(event: Event): void {
    this.confirmationText = (event.target as HTMLInputElement).value;
  }

  cancel(): void {
    this.close(() => this.cancelled.emit());
  }

  private close(emit: () => void): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    this.closeTimer = setTimeout(() => {
      emit();
      this.closeTimer = null;
    }, 180);
  }

  private resetDialogState(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    this.closing = false;
    this.confirmationText = '';
  }
}
