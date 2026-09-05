import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { LucideMoon, LucideSun, LucideUserRound } from '@lucide/angular';

import { AppDropdownComponent } from '../app-dropdown/app-dropdown.component';
import { DropdownOption } from '../app-dropdown/dropdown-option.model';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { AccessControlService } from '../../../application/services/access-control.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    LanguageSwitcherComponent,
    AppDropdownComponent,
    LucideMoon,
    LucideSun,
    LucideUserRound,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  private readonly accessControl = inject(AccessControlService);

  @Input() showPrivateNavigation = false;
  @Input() isDarkMode = true;
  @Input() userInitial = '';

  @Output() themeToggled = new EventEmitter<void>();
  @Output() userMenuToggled = new EventEmitter<void>();

  readonly currentUrl = signal('');

  readonly energyOptions: DropdownOption[] = [
    {
      label: 'Consumo',
      labelKey: 'nav.consumption',
      value: 'energy',
      route: '/energy/consumption',
      description: 'Consumo actual',
      requiredPermission: 'VIEW_ENERGY',
    },
    {
      label: 'Historial',
      labelKey: 'nav.history',
      value: 'energy-history',
      route: '/energy/history',
      description: 'Lecturas anteriores',
      requiredPermission: 'VIEW_ENERGY',
    },
    {
      label: 'Reportes',
      labelKey: 'nav.reports',
      value: 'reports',
      route: '/energy/reports',
      aliases: ['/reports'],
      description: 'Analisis energetico',
      requiredPermission: 'VIEW_REPORTS',
    },
    {
      label: 'Metas',
      labelKey: 'nav.energyGoals',
      value: 'energy-goals',
      route: '/energy/goals',
      aliases: ['/reports/energy-goals'],
      description: 'Objetivos de consumo',
      requiredPermission: 'VIEW_REPORTS',
    },
  ];

  readonly workplaceOptions: DropdownOption[] = [
    {
      label: 'Sedes',
      labelKey: 'nav.locations',
      value: 'locations',
      route: '/spaces/sites',
      aliases: ['/workplace/locations'],
      description: 'Centros operativos',
      requiredPermission: 'MANAGE_SPACES',
    },
    {
      label: 'Habitaciones',
      labelKey: 'nav.rooms',
      value: 'rooms',
      route: '/spaces/rooms',
      aliases: ['/workplace/rooms'],
      description: 'Espacios internos',
      requiredPermission: 'MANAGE_SPACES',
    },
    {
      label: 'Asignaciones',
      labelKey: 'nav.assignments',
      value: 'assignments',
      route: '/spaces/assignments',
      aliases: ['/workplace/device-assignments'],
      description: 'Dispositivos por habitacion',
      requiredPermission: 'MANAGE_SPACES',
    },
  ];

  readonly operationOptions: DropdownOption[] = [
    {
      label: 'Dispositivos',
      labelKey: 'nav.devices',
      value: 'devices',
      route: '/operation/devices',
      aliases: ['/devices'],
      description: 'Control de equipos',
      requiredPermission: 'CONTROL_DEVICES',
    },
    {
      label: 'Grupos',
      labelKey: 'nav.deviceGroups',
      value: 'device-groups',
      route: '/operation/groups',
      aliases: ['/device-groups'],
      description: 'Agrupacion de dispositivos',
      requiredPermission: 'MANAGE_ROUTINES',
    },
    {
      label: 'Rutinas',
      labelKey: 'nav.routines',
      value: 'routines',
      route: '/operation/routines',
      aliases: ['/routines'],
      description: 'Automatizacion',
      requiredPermission: 'MANAGE_ROUTINES',
    },
    {
      label: 'Modos',
      labelKey: 'nav.operationModes',
      value: 'operation-modes',
      route: '/operation/modes',
      aliases: ['/operation-modes'],
      description: 'Planes operativos',
      requiredPermission: 'MANAGE_ROUTINES',
    },
  ];

  readonly alertsOptions: DropdownOption[] = [
    {
      label: 'Bandeja',
      labelKey: 'nav.inbox',
      value: 'alerts',
      route: '/alerts/inbox',
      aliases: ['/alerts'],
      description: 'Eventos detectados',
      requiredPermission: 'MANAGE_ALERTS',
    },
    {
      label: 'Reglas',
      labelKey: 'nav.rules',
      value: 'alert-rules',
      route: '/alerts/rules',
      description: 'Umbrales automaticos',
      requiredPermission: 'MANAGE_ALERTS',
    },
    {
      label: 'Preferencias',
      labelKey: 'nav.preferences',
      value: 'alert-preferences',
      route: '/alerts/preferences',
      aliases: ['/notifications/preferences', '/settings/notifications'],
      description: 'Sensibilidad y ruido',
      requiredPermission: 'MANAGE_ALERTS',
    },
  ];

  readonly supportOptions: DropdownOption[] = [
    {
      label: 'Soporte',
      labelKey: 'nav.supportTickets',
      value: 'support-tickets',
      route: '/service/support',
      aliases: ['/support-tickets'],
      description: 'Atencion al usuario',
      requiredPermission: 'MANAGE_SUPPORT',
    },
    {
      label: 'Mantenimiento',
      labelKey: 'nav.maintenanceTickets',
      value: 'maintenance-tickets',
      route: '/service/maintenance',
      aliases: ['/maintenance-tickets'],
      description: 'Revision tecnica',
      requiredPermission: 'MANAGE_SUPPORT',
    },
  ];

  constructor(private readonly router: Router) {
    this.currentUrl.set(this.router.url.split('?')[0]);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects.split('?')[0]));
  }

  activeValue(options: DropdownOption[]): string | null {
    const url = this.currentUrl();
    const match = options
      .map((option) => ({
        option,
        matchedLength: this.matchedRouteLength(url, option),
      }))
      .filter((match) => match.matchedLength >= 0)
      .sort((left, right) => right.matchedLength - left.matchedLength)[0];

    return match?.option.value ?? null;
  }

  visibleOptions(options: DropdownOption[]): DropdownOption[] {
    return options.filter(
      (option) => !option.requiredPermission || this.accessControl.has(option.requiredPermission),
    );
  }

  toggleTheme(): void {
    this.themeToggled.emit();
  }

  toggleUserMenu(): void {
    this.userMenuToggled.emit();
  }

  private matchedRouteLength(url: string, option: DropdownOption): number {
    const routes = [option.route, ...(option.aliases ?? [])].filter((route): route is string =>
      Boolean(route),
    );

    return routes.reduce((bestMatch, route) => {
      const matches = url === route || url.startsWith(`${route}/`);

      return matches ? Math.max(bestMatch, route.length) : bestMatch;
    }, -1);
  }
}
