import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { App } from './app';
import { IamFacade } from './iam/application/services/iam.facade';
import { AuthSessionService } from './shared/application/services/auth-session.service';
import { ToastService } from './shared/application/services/toast.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            isAuthenticated: () => false,
            isSessionExpired: () => false,
            millisecondsUntilTimeout: () => null,
            recordActivity: () => undefined,
          },
        },
        {
          provide: IamFacade,
          useValue: {
            signOut: () => Promise.resolve(),
          },
        },
        {
          provide: ToastService,
          useValue: {
            info: () => undefined,
          },
        },
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => key,
          },
        },
      ],
    })
      .overrideComponent(App, {
        set: {
          imports: [],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should set the fallback page title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(TestBed.inject(Title).getTitle()).toBe('EnergyCore | WebApp');
  });
});
