import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Invoice } from '../../domain/model/invoice.entity';

import { CancelSubscriptionCommand } from '../commands/cancel-subscription.command';
import { DownloadInvoiceCommand } from '../commands/download-invoice.command';
import { PaymentFormCommand } from '../commands/payment-form.command';

import { InvoicesApiService } from '../../infrastructure/api/invoices-api.service';
import { PaymentsApiService } from '../../infrastructure/api/payments-api.service';
import { PlansApiService } from '../../infrastructure/api/plans-api.service';
import { SubscriptionsApiService } from '../../infrastructure/api/subscriptions-api.service';

import { InvoiceAssembler } from '../../infrastructure/assemblers/invoice.assembler';
import { PaymentAssembler } from '../../infrastructure/assemblers/payment.assembler';
import { PlanAssembler } from '../../infrastructure/assemblers/plan.assembler';
import { SubscriptionAssembler } from '../../infrastructure/assemblers/subscription.assembler';

import { PaymentValidationService } from '../../domain/services/payment-validation.service';
import { SubscriptionPolicyService } from '../../domain/services/subscription-policy.service';

import { BillingStore } from '../stores/billing.store';

@Injectable({
  providedIn: 'root',
})
export class BillingFacade {
  private readonly planAssembler = new PlanAssembler();
  private readonly subscriptionAssembler = new SubscriptionAssembler();
  private readonly paymentAssembler = new PaymentAssembler();
  private readonly invoiceAssembler = new InvoiceAssembler();

  get plans() {
    return this.store.plans;
  }

  get activeSubscription() {
    return this.store.activeSubscription;
  }

  get payments() {
    return this.store.payments;
  }

  get invoices() {
    return this.store.invoices;
  }

  get lastPayment() {
    return this.store.lastPayment;
  }

  get loading() {
    return this.store.loading;
  }

  get error() {
    return this.store.error;
  }

  get hasActiveSubscription() {
    return this.store.hasActiveSubscription;
  }

  get activePlanCode() {
    return this.store.activePlanCode;
  }

  get activePlan() {
    return this.store.activePlan;
  }

  constructor(
    private readonly plansApi: PlansApiService,
    private readonly subscriptionsApi: SubscriptionsApiService,
    private readonly paymentsApi: PaymentsApiService,
    private readonly invoicesApi: InvoicesApiService,
    private readonly subscriptionPolicyService: SubscriptionPolicyService,
    private readonly paymentValidationService: PaymentValidationService,
    private readonly store: BillingStore
  ) {}

  async loadBilling(): Promise<void> {
    this.startRequest();

    try {
      await this.refreshBillingData();
    } catch (error) {
      console.error(error);
      this.store.setError('billing.loadError');
    } finally {
      this.finishRequest();
    }
  }

  async loadPlans(): Promise<void> {
    const responses = await firstValueFrom(this.plansApi.findAll());

    this.store.setPlans(
      responses.map((response) => this.planAssembler.toEntity(response))
    );
  }

  async loadActiveSubscription(): Promise<void> {
    const response = await firstValueFrom(
      this.subscriptionsApi.findCurrent()
    );

    const activeSubscription = response
      ? this.subscriptionAssembler.toEntity(response)
      : null;

    this.store.setActiveSubscription(activeSubscription);
  }

  async loadPayments(): Promise<void> {
    const responses = await firstValueFrom(
      this.paymentsApi.findCurrentUserPayments()
    );

    const payments = responses
      .map((response) => this.paymentAssembler.toEntity(response))
      .sort((first, second) => second.id - first.id);

    this.store.setPayments(payments);
    this.store.setLastPayment(payments[0] ?? null);
  }

  async loadInvoices(): Promise<void> {
    const responses = await firstValueFrom(
      this.invoicesApi.findCurrentUserInvoices()
    );

    const invoices = responses
      .map((response) => this.invoiceAssembler.toEntity(response))
      .sort((first, second) => {
        const firstDate = new Date(first.issuedAt).getTime();
        const secondDate = new Date(second.issuedAt).getTime();

        return secondDate - firstDate;
      });

    this.store.setInvoices(invoices);
  }

  async processPaymentAndSubscribe(command: PaymentFormCommand): Promise<boolean> {
    this.startRequest();

    try {
      this.validatePaymentCommand(command);

      const response = await firstValueFrom(
        this.subscriptionsApi.checkout({
          planCode: command.planCode,
          holderName: command.holderName.trim(),
          cardNumber: command.cardNumber,
          expirationDate: command.expirationDate,
          cvv: command.cvv,
        })
      );

      this.store.setActiveSubscription(
        this.subscriptionAssembler.toEntity(response)
      );

      await this.refreshBillingData();

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('billing.subscribeError');

      await this.safeRefreshBillingData();

      return false;
    } finally {
      this.finishRequest();
    }
  }

  async cancelSubscription(_command: CancelSubscriptionCommand): Promise<boolean> {
    this.startRequest();

    try {
      await this.cancelActiveSubscriptionByCurrentUser();
      await this.refreshBillingData();

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('billing.cancelError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async cancelCurrentSubscription(): Promise<boolean> {
    this.startRequest();

    try {
      const currentSubscription = this.store.activeSubscription();

      if (!this.subscriptionPolicyService.canCancelSubscription(currentSubscription)) {
        this.store.setError('billing.cancelError');
        return false;
      }

      await this.cancelActiveSubscriptionByCurrentUser();
      await this.refreshBillingData();

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('billing.cancelError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  downloadInvoice(command: DownloadInvoiceCommand): void {
    const invoice: Invoice | undefined = this.store
      .invoices()
      .find((item) => item.id === command.invoiceId);

    if (!invoice) {
      this.store.setError('billing.invoiceNotFound');
      return;
    }

    const content = [
      'ENERGYCORE INVOICE',
      `Invoice ID: ${invoice.id}`,
      `Invoice Number: ${invoice.invoiceNumber}`,
      `User ID: ${invoice.userId}`,
      `Amount: ${invoice.currency} ${invoice.totalAmount}`,
      `Issued At: ${invoice.issuedAt}`,
    ].join('\n');

    const blob = new Blob([content], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `energycore-invoice-${invoice.id}.txt`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  clearMessages(): void {
    this.store.clearMessages();
  }

  clearActiveSubscription(): void {
    this.store.setActiveSubscription(null);
  }

  private async cancelActiveSubscriptionByCurrentUser(): Promise<void> {
    await firstValueFrom(
      this.subscriptionsApi.cancelCurrent()
    );

    this.store.setActiveSubscription(null);
  }

  private validatePaymentCommand(command: PaymentFormCommand): void {
    this.store.setError(null);

    if (!this.paymentValidationService.isValidHolderName(command.holderName)) {
      this.store.setError('billing.invalidHolderName');
      throw new Error('Invalid holder name.');
    }

    if (!this.paymentValidationService.isValidCardNumber(command.cardNumber)) {
      this.store.setError('billing.invalidCardNumber');
      throw new Error('Invalid card number.');
    }

    if (!this.paymentValidationService.isValidExpirationDate(command.expirationDate)) {
      this.store.setError('billing.invalidExpirationDate');
      throw new Error('Invalid expiration date.');
    }

    if (!this.paymentValidationService.isValidCvv(command.cvv)) {
      this.store.setError('billing.invalidCvv');
      throw new Error('Invalid CVV.');
    }
  }

  private async refreshBillingData(): Promise<void> {
    await Promise.all([
      this.loadPlans(),
      this.loadActiveSubscription(),
      this.loadPayments(),
      this.loadInvoices(),
    ]);
  }

  private async safeRefreshBillingData(): Promise<void> {
    try {
      await this.refreshBillingData();
    } catch (error) {
      console.error(error);
    }
  }

  private startRequest(): void {
    this.store.setLoading(true);
    this.store.clearMessages();
  }

  private finishRequest(): void {
    this.store.setLoading(false);
  }
}
