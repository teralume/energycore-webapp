import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import { PlanCode } from '../../domain/model/plan.entity';

export interface PlanResponse extends BaseResponse<number> {
  code: PlanCode;
  name: string;
  monthlyPrice: number;
  currency: string;
  maxDevices: number | null;
  maxRoutines: number | null;
  maxAlerts: number | null;
  reportExportEnabled: boolean;
}