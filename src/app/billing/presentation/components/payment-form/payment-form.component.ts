import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { Plan } from '../../../domain/model/plan.entity';
import { PaymentFormCommand } from '../../../application/commands/payment-form.command';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { ModalFormShellComponent } from '../../../../shared/presentation/components/modal-form-shell/modal-form-shell.component';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [FormsModule, TranslateModule, AppButtonComponent, ModalFormShellComponent],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss'],
})
export class PaymentFormComponent {
  @Input({ required: true }) plan!: Plan;
  @Input() loading = false;

  @Output() confirmed = new EventEmitter<PaymentFormCommand>();
  @Output() canceled = new EventEmitter<void>();

  holderName = '';
  cardNumber = '';
  expirationDate = '';
  cvv = '';

  onCardNumberChange(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber = digits.match(/.{1,4}/g)?.join(' ') ?? '';
  }

  onExpirationDateChange(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 4);

    if (digits.length <= 2) {
      this.expirationDate = digits;
      return;
    }

    this.expirationDate = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  onCvvChange(value: string): void {
    this.cvv = value.replace(/\D/g, '').slice(0, 3);
  }

  onConfirm(): void {
    this.confirmed.emit({
      planCode: this.plan.code,
      holderName: this.holderName,
      cardNumber: this.cardNumber,
      expirationDate: this.expirationDate,
      cvv: this.cvv,
    });
  }

  onCancel(): void {
    this.canceled.emit();
  }
}
