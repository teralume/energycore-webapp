import { Injectable, computed, signal } from '@angular/core';

import { Invoice } from '../../domain/model/invoice.entity';
import { Payment } from '../../domain/model/payment.entity';
import { Plan, PlanCode } from '../../domain/model/plan.entity';
import { Subscription } from '../../domain/model/subscription.entity';

@Injectable({
  providedIn: 'root',
})
export class BillingStore {
  private readonly plansSignal = signal<Plan[]>([]);
  private readonly activeSubscriptionSignal = signal<Subscription | null>(null);
  private readonly paymentsSignal = signal<Payment[]>([]);
  private readonly invoicesSignal = signal<Invoice[]>([]);
  private readonly lastPaymentSignal = signal<Payment | null>(null);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly plans = computed(() => this.plansSignal());
  readonly activeSubscription = computed(() => this.activeSubscriptionSignal());
  readonly payments = computed(() => this.paymentsSignal());
  readonly invoices = computed(() => this.invoicesSignal());
  readonly lastPayment = computed(() => this.lastPaymentSignal());

  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly hasActiveSubscription = computed(
    () => this.activeSubscriptionSignal()?.isActive ?? false
  );

  readonly activePlanCode = computed<PlanCode | null>(() => {
    const subscription = this.activeSubscriptionSignal();
    return subscription?.isActive ? subscription.planCode : null;
  });

  readonly activePlan = computed<Plan | null>(() => {
    const activeCode = this.activePlanCode();

    if (!activeCode) return null;

    return this.plansSignal().find((plan) => plan.code === activeCode) ?? null;
  });

  setPlans(value: Plan[]): void {
    this.plansSignal.set(value);
  }

  setActiveSubscription(value: Subscription | null): void {
    this.activeSubscriptionSignal.set(value);
  }

  setPayments(value: Payment[]): void {
    this.paymentsSignal.set(value);
  }

  setInvoices(value: Invoice[]): void {
    this.invoicesSignal.set(value);
  }

  setLastPayment(value: Payment | null): void {
    this.lastPaymentSignal.set(value);
  }

  prependPayment(value: Payment): void {
    this.paymentsSignal.update((payments) => [value, ...payments]);
    this.lastPaymentSignal.set(value);
  }

  prependInvoice(value: Invoice): void {
    this.invoicesSignal.update((invoices) => [value, ...invoices]);
  }

  setLoading(value: boolean): void {
    this.loadingSignal.set(value);
  }

  setError(value: string | null): void {
    this.errorSignal.set(value);
  }

  clearMessages(): void {
    this.errorSignal.set(null);
  }

  reset(): void {
    this.plansSignal.set([]);
    this.activeSubscriptionSignal.set(null);
    this.paymentsSignal.set([]);
    this.invoicesSignal.set([]);
    this.lastPaymentSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
