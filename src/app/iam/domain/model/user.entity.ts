import { BaseEntity } from '../../../shared/domain/model/base.entity';

export class User extends BaseEntity<number> {
  private readonly _fullName: string;
  private readonly _email: string;
  private readonly _accessProfileId: number;
  private readonly _accessProfileName: string;
  private readonly _status: string;
  private readonly _createdAt: string;

  constructor(props: {
    id: number;
    fullName: string;
    email: string;
    accessProfileId: number;
    accessProfileName: string;
    status?: string;
    createdAt: string;
  }) {
    super(props.id);
    this._fullName = props.fullName;
    this._email = props.email;
    this._accessProfileId = props.accessProfileId;
    this._accessProfileName = props.accessProfileName;
    this._status = props.status ?? 'ACTIVE';
    this._createdAt = props.createdAt;
  }

  get fullName(): string {
    return this._fullName;
  }

  get email(): string {
    return this._email;
  }

  get accessProfileId(): number {
    return this._accessProfileId;
  }

  get accessProfileName(): string {
    return this._accessProfileName;
  }

  get status(): string {
    return this._status;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get initials(): string {
    return this._fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
