import { TranslateModule } from '@ngx-translate/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-number-stepper',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './app-number-stepper.component.html',
  styleUrls: ['./app-number-stepper.component.scss'],
})
export class AppNumberStepperComponent {
  @Input() label = '';
  @Input() value: number | null = null;
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() step = 1;
  @Input() decimals = 0;
  @Input() suffix = '';
  @Input() placeholder = '';
  @Input() allowEmpty = true;

  @Output() valueChange = new EventEmitter<number | null>();

  get inputValue(): string {
    if (this.value === null) {
      return this.allowEmpty ? '' : String(this.fallbackValue);
    }

    return String(this.clampValue(this.value));
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = this.sanitizeInput(input.value);

    if (sanitizedValue === '') {
      if (this.allowEmpty) {
        this.valueChange.emit(null);
        input.value = '';
        return;
      }

      input.value = String(this.fallbackValue);
      this.valueChange.emit(this.fallbackValue);
      return;
    }

    const nextValue = this.clampValue(Number(sanitizedValue));

    input.value = String(nextValue);
    this.valueChange.emit(nextValue);
  }

  onBlur(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.value.trim() === '') {
      const nextValue = this.allowEmpty ? null : this.fallbackValue;

      input.value = nextValue === null ? '' : String(nextValue);
      this.valueChange.emit(nextValue);
      return;
    }

    const nextValue = this.clampValue(Number(input.value));

    input.value = String(nextValue);
    this.valueChange.emit(nextValue);
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const input = event.target as HTMLInputElement;
    const pastedValue = event.clipboardData?.getData('text') ?? '';
    const sanitizedValue = this.sanitizeInput(pastedValue);

    if (sanitizedValue === '') {
      if (!this.allowEmpty) {
        input.value = String(this.fallbackValue);
        this.valueChange.emit(this.fallbackValue);
      }

      return;
    }

    const nextValue = this.clampValue(Number(sanitizedValue));

    input.value = String(nextValue);
    this.valueChange.emit(nextValue);
  }

  increase(): void {
    const currentValue = this.value ?? this.fallbackValue;
    const nextValue = this.clampValue(currentValue + this.step);

    this.valueChange.emit(nextValue);
  }

  decrease(): void {
    const currentValue = this.value ?? this.fallbackValue;
    const nextValue = this.clampValue(currentValue - this.step);

    this.valueChange.emit(nextValue);
  }

  private get fallbackValue(): number {
    return this.min ?? 0;
  }

  private clampValue(value: number): number {
    let nextValue = Number.isFinite(value) ? value : this.fallbackValue;

    if (this.decimals <= 0) {
      nextValue = Math.trunc(nextValue);
    } else {
      nextValue = Number(nextValue.toFixed(this.decimals));
    }

    if (this.min !== null) {
      nextValue = Math.max(this.min, nextValue);
    }

    if (this.max !== null) {
      nextValue = Math.min(this.max, nextValue);
    }

    return nextValue;
  }

  private sanitizeInput(value: string): string {
    if (this.decimals <= 0) {
      return value.replace(/\D/g, '');
    }

    const normalizedValue = value.replace(',', '.');
    const [integerPart, ...decimalParts] = normalizedValue.split('.');
    const integerDigits = integerPart.replace(/\D/g, '');
    const decimalDigits = decimalParts.join('').replace(/\D/g, '').slice(0, this.decimals);

    return decimalDigits.length ? `${integerDigits}.${decimalDigits}` : integerDigits;
  }
}
