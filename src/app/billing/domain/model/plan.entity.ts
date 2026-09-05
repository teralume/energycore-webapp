import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type PlanCode = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export class Plan extends BaseEntity<number> {
  private readonly _code: PlanCode;
  private readonly _name: string;
  private readonly _monthlyPrice: number;
  private readonly _currency: string;
  private readonly _maxDevices: number | null;
  private readonly _maxRoutines: number | null;
  private readonly _maxAlerts: number | null;
  private readonly _reportExportEnabled: boolean;

  constructor(props: {
    id: number;
    code: PlanCode;
    name: string;
    monthlyPrice: number;
    currency: string;
    maxDevices: number | null;
    maxRoutines: number | null;
    maxAlerts: number | null;
    reportExportEnabled: boolean;
  }) {
    super(props.id);
    this._code = props.code;
    this._name = props.name;
    this._monthlyPrice = props.monthlyPrice;
    this._currency = props.currency;
    this._maxDevices = props.maxDevices;
    this._maxRoutines = props.maxRoutines;
    this._maxAlerts = props.maxAlerts;
    this._reportExportEnabled = props.reportExportEnabled;
  }

  get code(): PlanCode {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get monthlyPrice(): number {
    return this._monthlyPrice;
  }

  get currency(): string {
    return this._currency;
  }

  get maxDevices(): number | null {
    return this._maxDevices;
  }

  get maxRoutines(): number | null {
    return this._maxRoutines;
  }

  get maxAlerts(): number | null {
    return this._maxAlerts;
  }

  get reportExportEnabled(): boolean {
    return this._reportExportEnabled;
  }

  get isStarter(): boolean {
    return this._code === 'STARTER';
  }

  get isProfessional(): boolean {
    return this._code === 'PROFESSIONAL';
  }

  get isEnterprise(): boolean {
    return this._code === 'ENTERPRISE';
  }
}