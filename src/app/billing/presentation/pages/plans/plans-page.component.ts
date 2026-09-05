import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { BillingFacade } from '../../../application/services/billing.facade';
import { PaymentFormCommand } from '../../../application/commands/payment-form.command';
import { Plan, PlanCode } from '../../../domain/model/plan.entity';

import { PlanCardComponent } from '../../components/plan-card/plan-card.component';
import { PaymentFormComponent } from '../../components/payment-form/payment-form.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { ToastService } from '../../../../shared/application/services/toast.service';

@Component({
  selector: 'app-plans-page',
  standalone: true,
  imports: [
    TranslateModule,
    PlanCardComponent,
    PaymentFormComponent,
    LoadingSpinnerComponent,
    AppButtonComponent,
  ],
  templateUrl: './plans-page.component.html',
  styleUrls: ['./plans-page.component.scss'],
})
export class PlansPageComponent implements OnInit {
  selectedPlan: Plan | null = null;

  constructor(
    readonly billingFacade: BillingFacade,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.billingFacade.loadBilling();

    if (this.billingFacade.error()) {
      this.toastService.error('No se pudo cargar la información de facturación.');
      return;
    }

    this.openSelectedPlanFromRoute();
  }

  openPayment(plan: Plan): void {
    this.billingFacade.clearMessages();
    this.selectedPlan = plan;
  }

  closePayment(): void {
    this.selectedPlan = null;
  }

  async confirmPayment(command: PaymentFormCommand): Promise<void> {
    const success = await this.billingFacade.processPaymentAndSubscribe(command);

    if (success) {
      this.selectedPlan = null;
      this.toastService.success('Pago registrado y plan activado.');
      return;
    }

    this.toastService.error('No se pudo registrar el pago.');
  }

  async cancelSubscription(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Cancelar plan',
      message: 'Tu suscripcion activa quedara cancelada. Confirma solo si ya no quieres continuar con el plan.',
      confirmLabel: 'Cancelar plan',
      cancelLabel: 'Conservar plan',
      tone: 'warning',
    });

    if (!confirmed) {
      return;
    }

    const success = await this.billingFacade.cancelCurrentSubscription();

    if (success) {
      this.toastService.info('Suscripción cancelada.');
      return;
    }

    this.toastService.error('No se pudo cancelar la suscripción.');
  }

  private openSelectedPlanFromRoute(): void {
    const planCode = this.route.snapshot.queryParamMap.get('planCode');

    if (!this.isPlanCode(planCode)) {
      return;
    }

    const plan = this.billingFacade
      .plans()
      .find((item) => item.code === planCode);

    if (!plan || this.billingFacade.activePlanCode() === plan.code) {
      this.clearPlanQueryParams();
      return;
    }

    this.selectedPlan = plan;
    this.clearPlanQueryParams();
  }

  private clearPlanQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        planCode: null,
        source: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private isPlanCode(value: string | null): value is PlanCode {
    return (
      value === 'STARTER' ||
      value === 'PROFESSIONAL' ||
      value === 'ENTERPRISE'
    );
  }
}
