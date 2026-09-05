import { BaseEntity } from '../../../shared/domain/model/base.entity';

export class Room extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _locationId: number;
  private readonly _name: string;
  private readonly _floor: string;
  private readonly _createdAt: string;

  constructor(props: {
    id: number;
    userId: number;
    locationId: number;
    name: string;
    floor: string;
    createdAt: string;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._locationId = props.locationId;
    this._name = props.name;
    this._floor = props.floor;
    this._createdAt = props.createdAt;
  }

  get userId(): number {
    return this._userId;
  }

  get locationId(): number {
    return this._locationId;
  }

  get name(): string {
    return this._name;
  }

  get floor(): string {
    return this._floor;
  }

  get createdAt(): string {
    return this._createdAt;
  }
}