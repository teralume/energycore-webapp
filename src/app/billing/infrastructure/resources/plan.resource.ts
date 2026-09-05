import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import { PlanCode } from '../../domain/model/plan.entity';

export interface PlanResource extends BaseResource {
  code: PlanCode;
  name: string;
  monthlyPrice: number;
  currency: string;
  maxDevices: number | null;
  maxRoutines: number | null;
  maxAlerts: number | null;
  reportExportEnabled: boolean;
}