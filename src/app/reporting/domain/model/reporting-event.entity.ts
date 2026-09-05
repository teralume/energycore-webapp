import { BaseEntity } from '../../../shared/domain/model/base.entity';

export class ReportingEvent extends BaseEntity<number> {
  private readonly _eventName: string;
  private readonly _sourceContext: string;
  private readonly _subjectType: string;
  private readonly _subjectId: string | null;
  private readonly _summary: string;
  private readonly _detail: string | null;
  private readonly _occurredOn: string;

  constructor(props: {
    id: number;
    eventName: string;
    sourceContext: string;
    subjectType: string;
    subjectId?: string | null;
    summary: string;
    detail?: string | null;
    occurredOn: string;
  }) {
    super(props.id);
    this._eventName = props.eventName;
    this._sourceContext = props.sourceContext;
    this._subjectType = props.subjectType;
    this._subjectId = props.subjectId ?? null;
    this._summary = props.summary;
    this._detail = props.detail ?? null;
    this._occurredOn = props.occurredOn;
  }

  get eventName(): string {
    return this._eventName;
  }

  get sourceContext(): string {
    return this._sourceContext;
  }

  get subjectType(): string {
    return this._subjectType;
  }

  get subjectId(): string | null {
    return this._subjectId;
  }

  get summary(): string {
    return this._summary;
  }

  get detail(): string | null {
    return this._detail;
  }

  get occurredOn(): string {
    return this._occurredOn;
  }
}
