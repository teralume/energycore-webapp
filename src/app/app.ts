import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { AppLayoutComponent } from './shared/presentation/components/app-layout/app-layout.component';
import { AuthSessionService } from './shared/application/services/auth-session.service';
import { ToastService } from './shared/application/services/toast.service';
import { IamFacade } from './iam/application/services/iam.facade';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppLayoutComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit, OnDestroy {
  private readonly appName = 'EnergyCore';
  private readonly activityThrottleMs = 15 * 1000;
  private sessionTimeoutId: number | null = null;
  private lastActivitySync = 0;
  private handlingSessionTimeout = false;
  private readonly activityEvents = [
    'click',
    'keydown',
    'mousemove',
    'scroll',
    'touchstart',
    'visibilitychange',
  ];

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly titleService: Title,
    private readonly authSession: AuthSessionService,
    private readonly iamFacade: IamFacade,
    private readonly toastService: ToastService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.updatePageTitle();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageTitle();
        this.scheduleSessionTimeout();
      });

    this.registerActivityListeners();
    this.scheduleSessionTimeout();
  }

  ngOnDestroy(): void {
    this.unregisterActivityListeners();
    this.clearSessionTimeout();
  }

  private updatePageTitle(): void {
    let route = this.activatedRoute;

    while (route.firstChild) {
      route = route.firstChild;
    }

    const pageTitle = route.snapshot.data['title'] ?? 'WebApp';

    this.titleService.setTitle(`${this.appName} | ${pageTitle}`);
  }

  private registerActivityListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, this.onUserActivity, { passive: true });
    });
  }

  private unregisterActivityListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.activityEvents.forEach((eventName) => {
      window.removeEventListener(eventName, this.onUserActivity);
    });
  }

  private readonly onUserActivity = (): void => {
    if (!this.authSession.isAuthenticated()) {
      this.clearSessionTimeout();
      return;
    }

    const now = Date.now();

    if (this.authSession.isSessionExpired(now)) {
      void this.handleSessionTimeout();
      return;
    }

    if (now - this.lastActivitySync < this.activityThrottleMs) {
      return;
    }

    this.lastActivitySync = now;
    this.authSession.recordActivity(now);
    this.scheduleSessionTimeout(now);
  };

  private scheduleSessionTimeout(now = Date.now()): void {
    this.clearSessionTimeout();

    if (typeof window === 'undefined' || !this.authSession.isAuthenticated()) {
      return;
    }

    const millisecondsUntilTimeout = this.authSession.millisecondsUntilTimeout(now);

    if (millisecondsUntilTimeout === null) {
      return;
    }

    this.sessionTimeoutId = window.setTimeout(
      () => void this.handleSessionTimeout(),
      millisecondsUntilTimeout + 250
    );
  }

  private clearSessionTimeout(): void {
    if (typeof window === 'undefined' || this.sessionTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.sessionTimeoutId);
    this.sessionTimeoutId = null;
  }

  private async handleSessionTimeout(): Promise<void> {
    if (this.handlingSessionTimeout || !this.authSession.isAuthenticated()) {
      return;
    }

    this.handlingSessionTimeout = true;

    try {
      await this.iamFacade.signOut();
      this.toastService.info(this.translate.instant('auth.sessionExpired'));
    } finally {
      this.handlingSessionTimeout = false;
      this.clearSessionTimeout();
    }
  }
}
