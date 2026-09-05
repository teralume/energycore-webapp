import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import { EnergyGoalScopeType, EnergyGoalStatus } from '../../domain/model/energy-goal.entity';

export interface EnergyGoalResponse extends BaseResponse<number> {
  userId: number;
  title: string;
  targetKilowattHours: number;
  currentKilowattHours: number;
  /** Legacy API fields that were historically misnamed kWh values. */
  targetWatts?: number;
  currentWatts?: number;
  deadline: string;
  status: EnergyGoalStatus;
  createdAt: string;
  scopeType?: EnergyGoalScopeType | null;
  scopeId?: number | null;
  scopeName?: string | null;
  activeFrom?: string | null;
  activeTo?: string | null;
}
