import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  AuthenticatedUserSession,
  AuthSessionService,
} from '../../../shared/application/services/auth-session.service';
import { ROUTE_PATHS } from '../../../shared/infrastructure/constants/route-paths';

import { User } from '../../domain/model/user.entity';
import { AccessProfile } from '../../domain/model/access-profile.entity';

import { DeleteAccountCommand } from '../commands/delete-account.command';
import { RecoverPasswordCommand } from '../commands/recover-password.command';
import { ResetPasswordCommand } from '../commands/reset-password.command';
import { SignInCommand } from '../commands/sign-in.command';
import { SignUpCommand } from '../commands/sign-up.command';
import { UpdateProfileCommand } from '../commands/update-profile.command';

import { AuthApiService } from '../../infrastructure/api/auth-api.service';
import { AccessProfilesApiService } from '../../infrastructure/api/access-profiles-api.service';
import { UsersApiService } from '../../infrastructure/api/users-api.service';
import { AccessProfileAssembler } from '../../infrastructure/assemblers/access-profile.assembler';
import { UserAssembler } from '../../infrastructure/assemblers/user.assembler';

import { IamStore } from '../stores/iam.store';

interface SignUpOptions {
  navigateAfterSignUp?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class IamFacade {
  private readonly userAssembler = new UserAssembler();
  private readonly accessProfileAssembler = new AccessProfileAssembler();

  get currentUser() {
    return this.store.currentUser;
  }

  get users() {
    return this.store.users;
  }

  get accessProfiles() {
    return this.store.accessProfiles;
  }

  get loading() {
    return this.store.loading;
  }

  get error() {
    return this.store.error;
  }

  get isAuthenticated() {
    return this.store.isAuthenticated;
  }

  constructor(
    private readonly authApi: AuthApiService,
    private readonly accessProfilesApi: AccessProfilesApiService,
    private readonly usersApi: UsersApiService,
    private readonly authSession: AuthSessionService,
    private readonly router: Router,
    private readonly store: IamStore
  ) {}

  async signIn(command: SignInCommand): Promise<boolean> {
    this.startRequest();

    try {
      if (!this.isValidEmail(command.email)) {
        this.store.setError('auth.invalidEmail');
        return false;
      }

      if (!command.password.trim()) {
        this.store.setError('auth.signInError');
        return false;
      }

      const response = await firstValueFrom(
        this.authApi.signIn({
          email: command.email.trim().toLowerCase(),
          password: command.password,
        })
      );

      const user = this.userAssembler.toEntity(response.user);
      this.setAuthenticatedUser(user, response.token);

      await this.router.navigateByUrl(ROUTE_PATHS.HOME);

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('auth.signInError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async signUp(
    command: SignUpCommand,
    options: SignUpOptions = {}
  ): Promise<boolean> {
    this.startRequest();

    try {
      if (!command.fullName.trim()) {
        this.store.setError('auth.fullNameRequired');
        return false;
      }

      if (!this.isValidEmail(command.email)) {
        this.store.setError('auth.invalidEmail');
        return false;
      }

      if (!this.isAllowedEmailProvider(command.email)) {
        this.store.setError('auth.invalidEmailProvider');
        return false;
      }

      if (command.password.length < 8) {
        this.store.setError('auth.passwordTooShort');
        return false;
      }

      const response = await firstValueFrom(
        this.authApi.signUp({
          fullName: command.fullName.trim(),
          email: command.email.trim().toLowerCase(),
          password: command.password,
        })
      );

      const user = this.userAssembler.toEntity(response.user);
      this.setAuthenticatedUser(user, response.token);

      if (options.navigateAfterSignUp ?? true) {
        await this.router.navigateByUrl(ROUTE_PATHS.BILLING.PLANS);
      }

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('auth.signUpError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async restoreSession(): Promise<boolean> {
    this.store.setLoading(true);
    this.authSession.setLoading(true);

    try {
      const storedSession = this.authSession.restoreStoredSession();

      if (!storedSession) {
        return false;
      }

      const response = await firstValueFrom(this.authApi.me());
      const user = this.userAssembler.toEntity(response);

      this.setAuthenticatedUser(user, storedSession.token);
      return true;
    } catch {
      this.store.setCurrentUser(null);
      this.authSession.clearSession();
      return false;
    } finally {
      this.store.setLoading(false);
      this.authSession.setLoading(false);
    }
  }

  async signOut(): Promise<void> {
    this.store.setLoading(true);

    try {
      await firstValueFrom(this.authApi.signOut());
    } catch (error) {
      console.error(error);
    } finally {
      this.store.reset();
      this.authSession.clearSession();
      await this.router.navigateByUrl(ROUTE_PATHS.IAM.LOGIN);
    }
  }

  async recoverPassword(command: RecoverPasswordCommand): Promise<boolean> {
    this.startRequest();

    try {
      if (!this.isValidEmail(command.email)) {
        this.store.setError('auth.invalidEmail');
        return false;
      }

      await firstValueFrom(
        this.authApi.recoverPassword(command.email.trim().toLowerCase())
      );

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('auth.recoverPasswordError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async loadAccessProfiles(): Promise<AccessProfile[]> {
    this.startRequest();

    try {
      const responses = await firstValueFrom(this.accessProfilesApi.findAllProfiles());
      const profiles = responses.map((response) =>
        this.accessProfileAssembler.toEntity(response)
      );

      this.store.setAccessProfiles(profiles);
      return profiles;
    } catch (error) {
      console.error(error);
      this.store.setError('settings.access.loadError');
      return [];
    } finally {
      this.finishRequest();
    }
  }

  async loadManagedUsers(): Promise<User[]> {
    this.startRequest();

    try {
      const responses = await firstValueFrom(this.usersApi.findManagedUsers());
      const users = responses.map((response) => this.userAssembler.toEntity(response));

      this.store.setUsers(users);
      return users;
    } catch (error) {
      console.error(error);
      this.store.setError('settings.access.loadUsersError');
      return [];
    } finally {
      this.finishRequest();
    }
  }

  async assignAccessProfile(userId: number, accessProfileId: number): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.usersApi.assignAccessProfile(userId, { accessProfileId })
      );
      const updatedUser = this.userAssembler.toEntity(response);

      this.store.updateUser(updatedUser);

      const currentUser = this.store.currentUser();
      const token = this.authSession.token();
      if (currentUser?.id === updatedUser.id && token) {
        this.setAuthenticatedUser(updatedUser, token);
      }

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('settings.access.assignError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async resetPassword(command: ResetPasswordCommand): Promise<boolean> {
    this.startRequest();

    try {
      if (!command.token.trim()) {
        this.store.setError('auth.resetPasswordTokenRequired');
        return false;
      }

      if (command.password.length < 8) {
        this.store.setError('auth.passwordTooShort');
        return false;
      }

      if (command.password !== command.confirmPassword) {
        this.store.setError('auth.passwordsDoNotMatch');
        return false;
      }

      await firstValueFrom(
        this.authApi.resetPassword({
          token: command.token.trim(),
          password: command.password,
        })
      );

      await this.router.navigateByUrl(ROUTE_PATHS.IAM.LOGIN);

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('auth.resetPasswordError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async updateProfile(command: UpdateProfileCommand): Promise<boolean> {
    this.startRequest();

    try {
      const currentUser = this.store.currentUser();

      if (!currentUser) {
        this.store.setError('auth.signInError');
        return false;
      }

      if (!command.fullName.trim()) {
        this.store.setError('auth.fullNameRequired');
        return false;
      }

      if (!this.isValidEmail(command.email)) {
        this.store.setError('auth.invalidEmail');
        return false;
      }

      const response = await firstValueFrom(
        this.usersApi.updateCurrentProfile({
          fullName: command.fullName.trim(),
          email: command.email.trim().toLowerCase(),
          accessProfileId: currentUser.accessProfileId,
        })
      );

      const updatedUser = this.userAssembler.toEntity(response);
      const token = this.authSession.token();

      if (!token) {
        this.store.setError('auth.signInError');
        return false;
      }

      this.setAuthenticatedUser(updatedUser, token);

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('auth.profileUpdateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async deleteAccount(command: DeleteAccountCommand): Promise<boolean> {
    this.startRequest();

    try {
      const currentUser = this.store.currentUser();

      if (!currentUser) {
        this.store.setError('auth.signInError');
        return false;
      }

      if (command.confirmation !== 'ELIMINAR') {
        this.store.setError('auth.deleteAccountConfirmationError');
        return false;
      }

      await firstValueFrom(this.usersApi.deleteCurrentAccount());

      this.store.reset();
      this.authSession.clearSession();

      await this.router.navigateByUrl(ROUTE_PATHS.IAM.LOGIN);

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('auth.deleteAccountError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  clearMessages(): void {
    this.store.clearMessages();
  }

  private setAuthenticatedUser(user: User, token: string): void {
    this.store.setCurrentUser(user);

    const session: AuthenticatedUserSession = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      token,
      accessProfileId: user.accessProfileId,
      accessProfileName: user.accessProfileName,
    };

    this.authSession.setCurrentUser(session);
  }

  private startRequest(): void {
    this.store.setLoading(true);
    this.store.clearMessages();
  }

  private finishRequest(): void {
    this.store.setLoading(false);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private isAllowedEmailProvider(email: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();

    return (
      normalizedEmail.endsWith('@gmail.com') ||
      normalizedEmail.endsWith('@outlook.com') ||
      normalizedEmail.endsWith('@hotmail.com')
    );
  }
}
