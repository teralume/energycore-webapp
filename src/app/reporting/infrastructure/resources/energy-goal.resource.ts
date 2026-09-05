import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import { EnergyGoalScopeType, EnergyGoalStatus } from '../../domain/model/energy-goal.entity';

export interface EnergyGoalResource extends BaseResource {
  userId?: number;
  title: string;
  targetKilowattHours: number;
  currentKilowattHours: number;
  deadline: string;
  status: EnergyGoalStatus;
  createdAt?: string;
  scopeType?: EnergyGoalScopeType;
  scopeId?: number | null;
  scopeName?: string | null;
  activeFrom?: string | null;
  activeTo?: string | null;
}
