import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideMail, LucideSend } from '@lucide/angular';

import { IamFacade } from '../../../application/services/iam.facade';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AuthVisualPanelComponent } from '../../components/auth-visual-panel/auth-visual-panel.component';

@Component({
  selector: 'app-recover-password-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslateModule,
    AppButtonComponent,
    AuthVisualPanelComponent,
    LucideMail,
    LucideSend,
  ],
  templateUrl: './recover-password-page.component.html',
  styleUrls: ['./recover-password-page.component.scss'],
})
export class RecoverPasswordPageComponent {
  email = '';

  constructor(
    readonly iamFacade: IamFacade,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService,
  ) {}

  async onSubmit(): Promise<void> {
    const success = await this.iamFacade.recoverPassword({
      email: this.email,
    });

    if (success) {
      this.toastService.success(this.t('auth.recoverPasswordSent'));
      return;
    }

    this.toastService.error(this.t('auth.recoverPasswordError'));
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }
}
