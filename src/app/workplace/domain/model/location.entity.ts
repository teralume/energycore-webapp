import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type LocationType = 'HOME' | 'BUSINESS' | 'BRANCH';

export class Location extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _name: string;
  private readonly _address: string;
  private readonly _type: LocationType;
  private readonly _createdAt: string;

  constructor(props: {
    id: number;
    userId: number;
    name: string;
    address: string;
    type: LocationType;
    createdAt: string;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._name = props.name;
    this._address = props.address;
    this._type = props.type;
    this._createdAt = props.createdAt;
  }

  get userId(): number {
    return this._userId;
  }

  get name(): string {
    return this._name;
  }

  get address(): string {
    return this._address;
  }

  get type(): LocationType {
    return this._type;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get isBusiness(): boolean {
    return this._type === 'BUSINESS';
  }

  get isBranch(): boolean {
    return this._type === 'BRANCH';
  }

  get isHome(): boolean {
    return this._type === 'HOME';
  }
}