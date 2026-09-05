import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideKeyRound, LucideLockKeyhole } from '@lucide/angular';

import { IamFacade } from '../../../application/services/iam.facade';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AuthVisualPanelComponent } from '../../components/auth-visual-panel/auth-visual-panel.component';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslateModule,
    AppButtonComponent,
    AuthVisualPanelComponent,
    LucideKeyRound,
    LucideLockKeyhole,
  ],
  templateUrl: './reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.scss'],
})
export class ResetPasswordPageComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';

  constructor(
    readonly iamFacade: IamFacade,
    private readonly route: ActivatedRoute,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.toastService.error(this.t('auth.resetPasswordTokenRequired'));
    }
  }

  async onSubmit(): Promise<void> {
    const success = await this.iamFacade.resetPassword({
      token: this.token,
      password: this.password,
      confirmPassword: this.confirmPassword,
    });

    if (success) {
      this.toastService.success(this.t('auth.resetPasswordSuccess'));
      return;
    }

    this.toastService.error(this.t(this.iamFacade.error() ?? 'auth.resetPasswordError'));
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }
}
