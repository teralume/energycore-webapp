export abstract class BaseEntity<TId> {
  protected constructor(private readonly _id: TId) {}

  get id(): TId {
    return this._id;
  }
}