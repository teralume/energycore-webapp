import { TranslateModule } from '@ngx-translate/core';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AccessPermission } from '../../../../iam/domain/model/access-permission.model';
import { ROUTE_PATHS } from '../../../infrastructure/constants/route-paths';
import { AccessControlService } from '../../../application/services/access-control.service';

type SettingsSectionId =
  | 'profile'
  | 'account'
  | 'security'
  | 'access'
  | 'billing'
  | 'platform';

interface SettingsNavItem {
  id: SettingsSectionId;
  labelKey: string;
  descriptionKey: string;
  link: string;
  requiredPermission?: AccessPermission;
}

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  imports: [
    TranslateModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './settings-shell.component.html',
  styleUrls: ['./settings-shell.component.scss'],
})
export class SettingsShellComponent {
  private readonly accessControl = inject(AccessControlService);

  readonly navItems: SettingsNavItem[] = [
    {
      id: 'profile',
      labelKey: 'settings.nav.profile',
      descriptionKey: 'settings.nav.profileDescription',
      link: ROUTE_PATHS.IAM.PROFILE,
    },
    {
      id: 'account',
      labelKey: 'settings.nav.account',
      descriptionKey: 'settings.nav.accountDescription',
      link: ROUTE_PATHS.IAM.ACCOUNT,
    },
    {
      id: 'security',
      labelKey: 'settings.nav.security',
      descriptionKey: 'settings.nav.securityDescription',
      link: ROUTE_PATHS.IAM.SECURITY,
    },
    {
      id: 'billing',
      labelKey: 'settings.nav.billing',
      descriptionKey: 'settings.nav.billingDescription',
      link: ROUTE_PATHS.BILLING.SETTINGS,
      requiredPermission: 'MANAGE_BILLING',
    },
    {
      id: 'access',
      labelKey: 'settings.nav.access',
      descriptionKey: 'settings.nav.accessDescription',
      link: ROUTE_PATHS.IAM.ACCESS,
      requiredPermission: 'MANAGE_ACCESS',
    },
    {
      id: 'platform',
      labelKey: 'settings.nav.platform',
      descriptionKey: 'settings.nav.platformDescription',
      link: ROUTE_PATHS.IAM.PLATFORM,
    },
  ];

  visibleNavItems(): SettingsNavItem[] {
    return this.navItems.filter((item) =>
      !item.requiredPermission || this.accessControl.has(item.requiredPermission)
    );
  }
}
