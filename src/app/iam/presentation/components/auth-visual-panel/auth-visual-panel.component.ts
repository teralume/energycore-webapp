import { Component, input } from '@angular/core';
import { LucideShieldCheck } from '@lucide/angular';

@Component({
  selector: 'app-auth-visual-panel',
  standalone: true,
  imports: [LucideShieldCheck],
  templateUrl: './auth-visual-panel.component.html',
  styleUrls: ['./auth-visual-panel.component.scss'],
})
export class AuthVisualPanelComponent {
  readonly compact = input(false);
}
