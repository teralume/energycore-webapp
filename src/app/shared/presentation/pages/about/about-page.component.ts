import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppButtonComponent } from '../../components/app-button/app-button.component';
import { SectionCardComponent } from '../../components/section-card/section-card.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [AppButtonComponent, SectionCardComponent, TranslateModule],
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss'],
})
export class AboutPageComponent {
  readonly heroSignalKeys = ['order', 'control', 'clarity'];
  readonly valueKeys = ['mission', 'vision'];
  readonly dailyUseKeys = [
    'site',
    'rooms',
    'devices',
    'groups',
    'routines',
    'mode',
    'energy',
    'goals',
    'alerts',
    'service',
    'billing',
  ];
  readonly recommendationKeys = [
    'site',
    'rooms',
    'assignments',
    'groups',
    'routines',
    'modes',
    'energy',
    'alerts',
    'rules',
    'names',
  ];
  readonly capabilityKeys = ['spaces', 'control', 'modes', 'energy', 'alerts', 'service', 'settings'];
  readonly carefulUseKeys = ['automation', 'alerts', 'reports', 'billing'];
}
