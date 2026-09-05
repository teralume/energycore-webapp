import { Component, Input } from '@angular/core';

import { AppButtonComponent, AppButtonVariant } from '../app-button/app-button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [AppButtonComponent],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionLink: string | unknown[] | null = null;
  @Input() actionVariant: AppButtonVariant = 'create';
  @Input() compact = false;
}
