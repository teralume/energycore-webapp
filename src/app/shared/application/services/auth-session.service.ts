import { computed, Injectable, signal } from '@angular/core';

export interface AuthenticatedUserSession {
  id: number;
  fullName: string;
  email: string;
  token: string;
  accessProfileId?: number;
  accessProfileName?: string;
  lastActivityAt?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  readonly inactivityTimeoutMs = 30 * 60 * 1000;

  private readonly storageKey = 'energycore_auth_session';
  private readonly currentUserSignal = signal<AuthenticatedUserSession | null>(null);
  private readonly loadingSignal = signal<boolean>(false);

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly loading = computed(() => this.loadingSignal());

  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  readonly userId = computed(() => this.currentUserSignal()?.id ?? null);
  readonly token = computed(() => this.currentUserSignal()?.token ?? null);
  readonly userEmail = computed(() => this.currentUserSignal()?.email ?? null);
  readonly userFullName = computed(() => this.currentUserSignal()?.fullName ?? null);
  readonly accessProfileName = computed(
    () => this.currentUserSignal()?.accessProfileName ?? null
  );

  setLoading(value: boolean): void {
    this.loadingSignal.set(value);
  }

  setCurrentUser(user: AuthenticatedUserSession): void {
    const session = this.withActivityTimestamp(user);

    this.currentUserSignal.set(session);
    this.persistSession(session);
  }

  clearSession(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.storageKey);
  }

  recordActivity(now = Date.now()): void {
    const currentUser = this.currentUserSignal();

    if (!currentUser) {
      return;
    }

    const session = {
      ...currentUser,
      lastActivityAt: now,
    };

    this.currentUserSignal.set(session);
    this.persistSession(session);
  }

  isSessionExpired(now = Date.now()): boolean {
    const currentUser = this.currentUserSignal();

    if (!currentUser) {
      return false;
    }

    return this.isExpiredSession(currentUser, now);
  }

  millisecondsUntilTimeout(now = Date.now()): number | null {
    const currentUser = this.currentUserSignal();

    if (!currentUser) {
      return null;
    }

    const lastActivityAt = currentUser.lastActivityAt ?? now;
    return Math.max(0, this.inactivityTimeoutMs - (now - lastActivityAt));
  }

  restoreStoredSession(): AuthenticatedUserSession | null {
    const rawSession = localStorage.getItem(this.storageKey);

    if (!rawSession) {
      return null;
    }

    try {
      const parsedSession = JSON.parse(rawSession) as AuthenticatedUserSession;

      if (!parsedSession.id || !parsedSession.email || !parsedSession.fullName || !parsedSession.token) {
        this.clearSession();
        return null;
      }

      const session = this.withActivityTimestamp(parsedSession);

      if (this.isExpiredSession(session)) {
        this.clearSession();
        return null;
      }

      this.currentUserSignal.set(session);
      this.persistSession(session);
      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  private withActivityTimestamp(session: AuthenticatedUserSession): AuthenticatedUserSession {
    return {
      ...session,
      lastActivityAt: session.lastActivityAt ?? Date.now(),
    };
  }

  private isExpiredSession(session: AuthenticatedUserSession, now = Date.now()): boolean {
    const lastActivityAt = session.lastActivityAt ?? now;
    return now - lastActivityAt >= this.inactivityTimeoutMs;
  }

  private persistSession(session: AuthenticatedUserSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }
}
