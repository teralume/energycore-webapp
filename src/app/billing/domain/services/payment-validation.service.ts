import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PaymentValidationService {
  isValidCardNumber(cardNumber: string): boolean {
    const sanitized = this.sanitizeCardNumber(cardNumber);
    return /^\d{16}$/.test(sanitized);
  }

  isValidCvv(cvv: string): boolean {
    const sanitized = cvv.trim();
    return /^\d{3}$/.test(sanitized);
  }

  isValidHolderName(holderName: string): boolean {
    return holderName.trim().length >= 3;
  }

  isValidExpirationDate(expirationDate: string): boolean {
    return /^(0[1-9]|1[0-2])\/\d{2}$/.test(expirationDate.trim());
  }

  sanitizeCardNumber(cardNumber: string): string {
    return cardNumber.replace(/\s/g, '');
  }

  getLastFourDigits(cardNumber: string): string {
    return this.sanitizeCardNumber(cardNumber).slice(-4);
  }
}
