import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';

import { BillingFacade } from '../../../application/services/billing.facade';

import { ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { SettingsSectionComponent } from '../../../../shared/presentation/components/settings-section/settings-section.component';
import { Invoice } from '../../../domain/model/invoice.entity';
import { PaymentStatus } from '../../../domain/model/payment.entity';
import { SubscriptionStatus } from '../../../domain/model/subscription.entity';

@Component({
  selector: 'app-billing-history-page',
  standalone: true,
  imports: [
    TranslateModule,
    AppButtonComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    SettingsSectionComponent,
  ],
  templateUrl: './billing-history-page.component.html',
  styleUrls: ['./billing-history-page.component.scss'],
})
export class BillingHistoryPageComponent implements OnInit {
  constructor(
    readonly billingFacade: BillingFacade,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.billingFacade.loadBilling();

    if (this.billingFacade.error()) {
      this.toastService.error(this.t('settings.billing.loadError'));
    }
  }

  downloadInvoice(invoiceId: number): void {
    const invoice = this.billingFacade
      .invoices()
      .find((item) => item.id === invoiceId);

    if (!invoice) {
      this.toastService.error(this.t('settings.billing.invoiceNotFound'));
      return;
    }

    try {
      this.billingFacade.downloadInvoice({ invoiceId });
      this.toastService.success(this.t('settings.billing.downloadSuccess'));
    } catch (error) {
      console.error(error);
      this.toastService.error(this.t('settings.billing.downloadError'));
    }
  }

  async cancelSubscription(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('settings.billing.cancelPlanTitle'),
      message: this.t('settings.billing.cancelPlanMessage'),
      confirmLabel: this.t('settings.billing.cancelPlanConfirm'),
      cancelLabel: this.t('settings.billing.keepPlan'),
      tone: 'warning',
    });

    if (!confirmed) {
      return;
    }

    const success = await this.billingFacade.cancelCurrentSubscription();

    if (success) {
      this.toastService.info(this.t('settings.billing.cancelSuccess'));
      return;
    }

    this.toastService.error(this.t('settings.billing.cancelError'));
  }

  formatMoney(amount: number | undefined, currency = 'PEN'): string {
    if (amount === undefined) {
      return '-';
    }

    const symbol = currency === 'PEN' ? 'S/' : currency;
    return `${symbol} ${amount.toFixed(2)}`;
  }

  formatLimit(value: number | null | undefined): string {
    return value === null || value === undefined
      ? this.t('settings.billing.unlimited')
      : String(value);
  }

  formatDate(value: string | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  subscriptionStatusLabel(status: SubscriptionStatus | undefined): string {
    const labels: Record<SubscriptionStatus, string> = {
      ACTIVE: 'settings.billing.subscriptionStatuses.active',
      CANCELLED: 'settings.billing.subscriptionStatuses.cancelled',
      EXPIRED: 'settings.billing.subscriptionStatuses.expired',
    };

    return this.t(status ? labels[status] : 'settings.billing.noActivePlan');
  }

  paymentStatusLabel(status: PaymentStatus | undefined): string {
    const labels: Record<PaymentStatus, string> = {
      APPROVED: 'settings.billing.paymentStatuses.approved',
      REJECTED: 'settings.billing.paymentStatuses.rejected',
      PENDING: 'settings.billing.paymentStatuses.pending',
    };

    return status ? this.t(labels[status]) : '-';
  }

  invoiceStateLabel(invoice: Invoice): string {
    return invoice.issuedAt
      ? this.t('settings.billing.invoiceIssued')
      : this.t('settings.billing.invoiceRegistered');
  }

  private currentLocale(): string {
    const localeByLanguage: Record<string, string> = {
      es: 'es-PE',
      en: 'en-US',
      pt: 'pt-BR',
    };

    return localeByLanguage[this.uiPreferences.currentLanguage()] ?? localeByLanguage['es'];
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }
}
