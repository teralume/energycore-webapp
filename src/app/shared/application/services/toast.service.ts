import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'critical' | 'error';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  leaving?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  private nextId = 1;
  private readonly defaultDurationMs = 3600;
  private readonly exitDurationMs = 320;

  success(message: string): void {
    this.show('success', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  critical(message: string): void {
    this.show('critical', message, 5200);
  }

  error(message: string): void {
    this.show('error', message, 5200);
  }

  dismiss(id: number): void {
    const target = this.toasts().find((toast) => toast.id === id);

    if (!target || target.leaving) {
      return;
    }

    this.toasts.update((toasts) =>
      toasts.map((toast) =>
        toast.id === id ? { ...toast, leaving: true } : toast
      )
    );

    window.setTimeout(() => {
      this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
    }, this.exitDurationMs);
  }

  private show(type: ToastType, message: string, durationMs = this.defaultDurationMs): void {
    const toast: ToastMessage = {
      id: this.nextId++,
      type,
      message,
    };

    this.toasts.update((toasts) => [toast, ...toasts].slice(0, 5));
    window.setTimeout(() => this.dismiss(toast.id), durationMs);
  }
}
