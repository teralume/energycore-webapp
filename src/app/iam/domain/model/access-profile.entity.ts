import { BaseEntity } from '../../../shared/domain/model/base.entity';
import { AccessPermission } from './access-permission.model';

export type AccessProfileName = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export class AccessProfile extends BaseEntity<number> {
  private readonly _name: AccessProfileName;
  private readonly _description: string;
  private readonly _permissions: AccessPermission[];

  constructor(props: {
    id: number;
    name: AccessProfileName;
    description: string;
    permissions?: AccessPermission[] | null;
  }) {
    super(props.id);
    this._name = props.name;
    this._description = props.description;
    this._permissions = props.permissions ?? [];
  }

  get name(): AccessProfileName {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get permissions(): AccessPermission[] {
    return this._permissions;
  }

  get isOwner(): boolean {
    return this._name === 'OWNER';
  }

  get isAdmin(): boolean {
    return this._name === 'ADMIN';
  }

  get isMember(): boolean {
    return this._name === 'MEMBER';
  }

  get isGuest(): boolean {
    return this._name === 'GUEST';
  }
}
