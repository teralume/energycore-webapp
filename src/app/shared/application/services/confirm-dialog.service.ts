import { computed, Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  requiredText?: string;
  requiredTextLabel?: string;
  requiredTextHint?: string;
}

export interface ConfirmDialogState {
  title: string;
  message: string;
  detail?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: ConfirmDialogTone;
  requiredText?: string;
  requiredTextLabel?: string;
  requiredTextHint?: string;
}

export type ConfirmDialogTone = 'warning' | 'danger' | 'info';

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private readonly activeDialog = signal<ConfirmDialogState | null>(null);
  private resolveCurrent?: (confirmed: boolean) => void;

  readonly dialog = computed(() => this.activeDialog());

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    this.close(false);

    return new Promise<boolean>((resolve) => {
      this.resolveCurrent = resolve;
      this.activeDialog.set({
        title: options.title ?? 'Confirmar accion',
        message: options.message,
        detail: options.detail,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        tone: options.tone ?? 'warning',
        requiredText: options.requiredText,
        requiredTextLabel: options.requiredTextLabel,
        requiredTextHint: options.requiredTextHint,
      });
    });
  }

  async confirmSequence(options: ConfirmDialogOptions[]): Promise<boolean> {
    for (const option of options) {
      const accepted = await this.confirm(option);

      if (!accepted) {
        return false;
      }
    }

    return true;
  }

  confirmCurrent(): void {
    this.close(true);
  }

  cancelCurrent(): void {
    this.close(false);
  }

  private close(confirmed: boolean): void {
    if (!this.activeDialog()) {
      return;
    }

    const resolve = this.resolveCurrent;
    this.resolveCurrent = undefined;
    this.activeDialog.set(null);
    resolve?.(confirmed);
  }
}
