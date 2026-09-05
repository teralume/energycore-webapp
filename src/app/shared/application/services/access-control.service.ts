import { computed, Injectable } from '@angular/core';

import { AccessPermission } from '../../../iam/domain/model/access-permission.model';
import { AuthSessionService } from './auth-session.service';

@Injectable({
  providedIn: 'root',
})
export class AccessControlService {
  readonly permissions = computed(() =>
    this.resolvePermissions(this.authSession.accessProfileName())
  );

  constructor(private readonly authSession: AuthSessionService) {}

  has(permission: AccessPermission): boolean {
    return this.permissions().includes(permission);
  }

  hasAll(permissions: AccessPermission[]): boolean {
    return permissions.every((permission) => this.has(permission));
  }

  hasAny(permissions: AccessPermission[]): boolean {
    return permissions.some((permission) => this.has(permission));
  }

  private resolvePermissions(profileName: string | null): AccessPermission[] {
    const normalized = (profileName ?? 'GUEST').trim().toUpperCase();

    if (normalized === 'OWNER') {
      return [
        'VIEW_HOME',
        'CONTROL_DEVICES',
        'MANAGE_DEVICES',
        'MANAGE_ROUTINES',
        'MANAGE_SPACES',
        'VIEW_ENERGY',
        'VIEW_REPORTS',
        'MANAGE_ALERTS',
        'MANAGE_SUPPORT',
        'MANAGE_BILLING',
        'MANAGE_ACCESS',
      ];
    }

    if (normalized === 'ADMIN') {
      return [
        'VIEW_HOME',
        'CONTROL_DEVICES',
        'MANAGE_DEVICES',
        'MANAGE_ROUTINES',
        'MANAGE_SPACES',
        'VIEW_ENERGY',
        'VIEW_REPORTS',
        'MANAGE_ALERTS',
        'MANAGE_SUPPORT',
        'MANAGE_ACCESS',
      ];
    }

    if (normalized === 'MEMBER') {
      return [
        'VIEW_HOME',
        'CONTROL_DEVICES',
        'MANAGE_DEVICES',
        'MANAGE_ROUTINES',
        'VIEW_ENERGY',
        'VIEW_REPORTS',
        'MANAGE_ALERTS',
        'MANAGE_SUPPORT',
      ];
    }

    return ['VIEW_HOME', 'CONTROL_DEVICES'];
  }
}
