import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthSessionService } from '../../../application/services/auth-session.service';
import { UiPreferencesService } from '../../../application/services/ui-preferences.service';
import { IamFacade } from '../../../../iam/application/services/iam.facade';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { ToastContainerComponent } from '../toast-container/toast-container.component';
import { WorkplaceFacade } from '../../../../workplace/application/services/workplace.facade';
import { ConfirmDialogService } from '../../../application/services/confirm-dialog.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LucideCreditCard, LucideInfo, LucideLogOut, LucideSettings } from '@lucide/angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    FooterComponent,
    HeaderComponent,
    ToastContainerComponent,
    ConfirmDialogComponent,
    LucideCreditCard,
    LucideInfo,
    LucideLogOut,
    LucideSettings,
  ],
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
})
export class AppLayoutComponent {
  readonly router = inject(Router);
  readonly translate = inject(TranslateService);
  readonly uiPreferences = inject(UiPreferencesService);
  readonly authSession = inject(AuthSessionService);
  readonly iamFacade = inject(IamFacade);
  readonly workplaceFacade = inject(WorkplaceFacade);
  readonly confirmDialog = inject(ConfirmDialogService);

  readonly currentUrl = signal(this.router.url);
  readonly isDrawerOpen = signal(false);

  readonly isAuthScreen = computed(() => {
    const url = this.currentUrl();
    return (
      url.startsWith('/iam/login') ||
      url.startsWith('/iam/register') ||
      url.startsWith('/iam/recover-password') ||
      url.startsWith('/iam/reset-password')
    );
  });

  readonly currentUser = computed(() => this.authSession.currentUser?.() ?? null);
  readonly isAuthenticated = computed(() => this.authSession.isAuthenticated());
  readonly isUserSidebarOpen = signal(false);
  readonly requiresLocationSetup = computed(() => {
    if (!this.isAuthenticated() || this.isAuthScreen()) {
      return false;
    }

    if (this.workplaceFacade.loading() || this.workplaceFacade.locations().length > 0) {
      return false;
    }

    const url = this.currentUrl().split('?')[0];
    const allowedPrefixes = [
      '/home',
      '/spaces/sites',
      '/workplace/locations',
      '/workplace',
      '/plans',
      '/alerts/preferences',
      '/notifications/preferences',
      '/settings/billing',
      '/settings/account',
      '/settings/notifications',
      '/settings/platform',
      '/billing/history',
      '/settings/profile',
      '/settings/security',
      '/iam/profile',
      '/about',
    ];

    return !allowedPrefixes.some((prefix) => url === prefix || url.startsWith(`${prefix}/`));
  });

  private workplaceLoadRequested = false;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navigation = event as NavigationEnd;
        this.currentUrl.set(navigation.urlAfterRedirects);
        this.ensureWorkplaceLoaded();
      });

    this.ensureWorkplaceLoaded();
  }

  openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  toggleTheme(): void {
    this.uiPreferences.toggleTheme();
  }

  signOut(): void {
    this.iamFacade.signOut();
  }

  currentUserName(): string {
    return this.currentUser()?.fullName || 'Usuario';
  }

  currentUserEmail(): string {
    return this.currentUser()?.email || 'Sin correo registrado';
  }

  currentUserRole(): string {
    return this.currentUser()?.accessProfileName || 'Member';
  }

  currentUserInitial(): string {
    return this.currentUserName().trim().charAt(0).toUpperCase() || 'U';
  }

  currentUserPhotoUrl(): string | null {
    return null;
  }

  toggleUserSidebar(): void {
    this.isUserSidebarOpen.update((value) => !value);
  }

  closeUserSidebar(): void {
    this.isUserSidebarOpen.set(false);
  }

  private ensureWorkplaceLoaded(): void {
    if (!this.isAuthenticated()) {
      this.workplaceLoadRequested = false;
      return;
    }

    if (this.isAuthScreen() || this.workplaceLoadRequested) {
      return;
    }

    this.workplaceLoadRequested = true;
    void this.workplaceFacade.loadWorkplace();
  }
}
