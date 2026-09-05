import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { API_BASE_URL } from './shared/infrastructure/api/api-config';
import { authInterceptor } from './shared/application/interceptors/auth.interceptor';
import { IamFacade } from './iam/application/services/iam.facade';
import { DEFAULT_LANGUAGE } from './shared/infrastructure/constants/app-language';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [IamFacade],
      useFactory: (iamFacade: IamFacade) => () => iamFacade.restoreSession(),
    },

    {
      provide: API_BASE_URL,
      useValue: environment.apiBaseUrl,
    },

    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json',
      }),
      fallbackLang: DEFAULT_LANGUAGE,
      lang: DEFAULT_LANGUAGE,
    }),
  ],
};
