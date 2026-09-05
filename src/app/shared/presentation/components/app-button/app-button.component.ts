import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'create' | 'action' | 'neutral';
export type AppButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './app-button.component.html',
  styleUrls: ['./app-button.component.scss'],
})
export class AppButtonComponent {
  @Input() variant: AppButtonVariant = 'primary';
  @Input() size: AppButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() block = false;
  @Input() link: string | unknown[] | null = null;
  @Input() ariaLabel = '';
  @Input() label = '';

  @Output() pressed = new EventEmitter<MouseEvent>();

  get className(): string {
    return [
      'app-button',
      `app-button--${this.variant}`,
      `app-button--${this.size}`,
      this.block ? 'app-button--block' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  onPressed(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.pressed.emit(event);
  }
}
