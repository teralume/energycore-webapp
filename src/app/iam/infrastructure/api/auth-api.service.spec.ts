import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService integration', () => {
  let service: AuthApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.energycore.test/api/v1' },
      ],
    });
    service = TestBed.inject(AuthApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends sign-in credentials to the shared API contract', () => {
    const credentials = {
      email: 'owner@energycore.test',
      password: 'ValidPassword123',
    };

    service.signIn(credentials).subscribe((response) => {
      expect(response.token).toBe('test-token');
    });

    const request = http.expectOne(
      'https://api.energycore.test/api/v1/auth/sign-in'
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);
    request.flush({
      token: 'test-token',
      user: {
        id: 7,
        email: credentials.email,
        fullName: 'EnergyCore Owner',
        status: 'ACTIVE',
        accessProfileName: 'OWNER',
      },
    });
  });
});
