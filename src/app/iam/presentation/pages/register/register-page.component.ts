import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideCircle,
  LucideCircleCheck,
  LucideLockKeyhole,
  LucideMail,
  LucideUserPlus,
  LucideUserRound,
} from '@lucide/angular';

import { PlanCode } from '../../../../billing/domain/model/plan.entity';
import { IamFacade } from '../../../application/services/iam.facade';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { ROUTE_PATHS } from '../../../../shared/infrastructure/constants/route-paths';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AuthVisualPanelComponent } from '../../components/auth-visual-panel/auth-visual-panel.component';

interface LandingSelectedPlan {
  code: PlanCode;
  name: string;
  price: string;
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslateModule,
    AppButtonComponent,
    AuthVisualPanelComponent,
    LucideCircle,
    LucideCircleCheck,
    LucideLockKeyhole,
    LucideMail,
    LucideUserPlus,
    LucideUserRound,
  ],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],
})
export class RegisterPageComponent implements OnInit {
  fullName = '';
  email = '';
  password = '';
  selectedLandingPlan: LandingSelectedPlan | null = null;

  constructor(
    readonly iamFacade: IamFacade,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const planCode = queryParams.get('planCode');

    if (!this.isPlanCode(planCode)) {
      return;
    }

    this.selectedLandingPlan = {
      code: planCode,
      name: queryParams.get('planName') || this.getDefaultPlanName(planCode),
      price: queryParams.get('planPrice') || this.getDefaultPlanPrice(planCode),
    };
  }

  get passwordRequirements() {
    return [
      {
        label: 'Mínimo 8 caracteres',
        valid: this.password.length >= 8,
      },
      {
        label: 'Al menos una mayúscula',
        valid: /[A-ZÁÉÍÓÚÑ]/.test(this.password),
      },
      {
        label: 'Al menos un número',
        valid: /\d/.test(this.password),
      },
    ];
  }

  get passwordIsValid(): boolean {
    return this.passwordRequirements.every((requirement) => requirement.valid);
  }

  get registrationIsLoading(): boolean {
    return this.iamFacade.loading();
  }

  async onSubmit(): Promise<void> {
    if (!this.passwordIsValid) {
      this.toastService.warning('Completa los requisitos de contraseña.');
      return;
    }

    const success = await this.iamFacade.signUp(
      {
        fullName: this.fullName,
        email: this.email,
        password: this.password,
      },
      {
        navigateAfterSignUp: false,
      },
    );

    if (!success) {
      this.toastService.error('No se pudo crear la cuenta.');
      return;
    }

    if (this.selectedLandingPlan) {
      await this.router.navigate([ROUTE_PATHS.BILLING.PLANS], {
        queryParams: {
          planCode: this.selectedLandingPlan.code,
          source: 'registration',
        },
      });
      return;
    }

    await this.router.navigateByUrl(ROUTE_PATHS.BILLING.PLANS);
  }

  private isPlanCode(value: string | null): value is PlanCode {
    return value === 'STARTER' || value === 'PROFESSIONAL' || value === 'ENTERPRISE';
  }

  private getDefaultPlanName(planCode: PlanCode): string {
    const names: Record<PlanCode, string> = {
      STARTER: 'Starter Plan',
      PROFESSIONAL: 'Professional Plan',
      ENTERPRISE: 'Enterprise Plan',
    };

    return names[planCode];
  }

  private getDefaultPlanPrice(planCode: PlanCode): string {
    const prices: Record<PlanCode, string> = {
      STARTER: '19.00',
      PROFESSIONAL: '49.00',
      ENTERPRISE: '99.00',
    };

    return prices[planCode];
  }
}
