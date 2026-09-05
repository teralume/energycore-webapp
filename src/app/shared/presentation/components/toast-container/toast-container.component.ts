import { TranslateModule } from '@ngx-translate/core';
import { Component, inject } from '@angular/core';

import { ToastService, ToastType } from '../../../application/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  labelFor(type: ToastType): string {
    const labels: Record<ToastType, string> = {
      success: 'Exito',
      info: 'Informacion',
      warning: 'Atencion',
      critical: 'Critico',
      error: 'Error',
    };

    return labels[type];
  }
}
