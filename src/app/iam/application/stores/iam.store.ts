import { Injectable, computed, signal } from '@angular/core';

import { User } from '../../domain/model/user.entity';
import { AccessProfile } from '../../domain/model/access-profile.entity';

@Injectable({
  providedIn: 'root',
})
export class IamStore {
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly usersSignal = signal<User[]>([]);
  private readonly accessProfilesSignal = signal<AccessProfile[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly users = computed(() => this.usersSignal());
  readonly accessProfiles = computed(() => this.accessProfilesSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  setCurrentUser(user: User | null): void {
    this.currentUserSignal.set(user);
  }

  setUsers(users: User[]): void {
    this.usersSignal.set(users);
  }

  updateUser(user: User): void {
    this.usersSignal.update((users) =>
      users.map((item) => (item.id === user.id ? user : item))
    );
  }

  setAccessProfiles(profiles: AccessProfile[]): void {
    this.accessProfilesSignal.set(profiles);
  }

  setLoading(value: boolean): void {
    this.loadingSignal.set(value);
  }

  setError(value: string | null): void {
    this.errorSignal.set(value);
  }

  clearMessages(): void {
    this.errorSignal.set(null);
  }

  reset(): void {
    this.currentUserSignal.set(null);
    this.usersSignal.set([]);
    this.accessProfilesSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
