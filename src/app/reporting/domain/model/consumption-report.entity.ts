import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type ConsumptionReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export class ConsumptionReport extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _title: string;
  private readonly _period: ConsumptionReportPeriod;
  private readonly _totalWatts: number;
  private readonly _averageWatts: number;
  private readonly _highestWatts: number;
  private readonly _startDate: string;
  private readonly _endDate: string;
  private readonly _generatedAt: string;

  constructor(props: {
    id: number;
    userId: number;
    title: string;
    period: ConsumptionReportPeriod;
    totalWatts: number;
    averageWatts: number;
    highestWatts: number;
    startDate: string;
    endDate: string;
    generatedAt: string;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._title = props.title;
    this._period = props.period;
    this._totalWatts = props.totalWatts;
    this._averageWatts = props.averageWatts;
    this._highestWatts = props.highestWatts;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._generatedAt = props.generatedAt;
  }

  get userId(): number {
    return this._userId;
  }

  get title(): string {
    return this._title;
  }

  get period(): ConsumptionReportPeriod {
    return this._period;
  }

  get totalWatts(): number {
    return this._totalWatts;
  }

  get averageWatts(): number {
    return this._averageWatts;
  }

  get highestWatts(): number {
    return this._highestWatts;
  }

  get startDate(): string {
    return this._startDate;
  }

  get endDate(): string {
    return this._endDate;
  }

  get generatedAt(): string {
    return this._generatedAt;
  }
}