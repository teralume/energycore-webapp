import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideLockKeyhole, LucideLogIn, LucideMail } from '@lucide/angular';

import { IamFacade } from '../../../application/services/iam.facade';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AuthVisualPanelComponent } from '../../components/auth-visual-panel/auth-visual-panel.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslateModule,
    AppButtonComponent,
    AuthVisualPanelComponent,
    LucideLockKeyhole,
    LucideLogIn,
    LucideMail,
  ],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent {
  email = '';
  password = '';

  constructor(
    readonly iamFacade: IamFacade,
    private readonly toastService: ToastService,
  ) {}

  async onSubmit(): Promise<void> {
    const success = await this.iamFacade.signIn({
      email: this.email,
      password: this.password,
    });

    if (!success) {
      this.toastService.error('No se pudo iniciar sesión.');
    }
  }
}
