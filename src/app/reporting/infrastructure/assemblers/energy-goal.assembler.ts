import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { EnergyGoal } from '../../domain/model/energy-goal.entity';
import { EnergyGoalResource } from '../resources/energy-goal.resource';
import { EnergyGoalResponse } from '../responses/energy-goal.response';

export class EnergyGoalAssembler extends BaseAssembler<
  EnergyGoal,
  EnergyGoalResource,
  EnergyGoalResponse
> {
  override toEntity(response: EnergyGoalResponse): EnergyGoal {
    return new EnergyGoal({
      id: response.id,
      userId: response.userId,
      title: response.title,
      targetKilowattHours: this.resolveTargetKilowattHours(response.targetKilowattHours, response.targetWatts),
      currentKilowattHours: this.resolveCurrentKilowattHours(response.currentKilowattHours, response.currentWatts),
      deadline: response.deadline,
      status: response.status,
      createdAt: response.createdAt,
      scopeType: response.scopeType ?? 'GENERAL',
      scopeId: response.scopeId ?? null,
      scopeName: response.scopeName,
      activeFrom: response.activeFrom,
      activeTo: response.activeTo,
    });
  }

  override toResource(entity: EnergyGoal): EnergyGoalResource {
    return {
      userId: entity.userId,
      title: entity.title,
      targetKilowattHours: entity.targetKilowattHours,
      currentKilowattHours: entity.currentKilowattHours,
      deadline: entity.deadline,
      status: entity.status,
      createdAt: entity.createdAt,
      scopeType: entity.scopeType,
      scopeId: entity.scopeId,
      scopeName: entity.scopeName,
      activeFrom: entity.activeFrom,
      activeTo: entity.activeTo,
    };
  }

  private resolveTargetKilowattHours(primary: number | undefined, legacyMisnamedKilowattHours: number | undefined): number {
    const value = Number(primary ?? legacyMisnamedKilowattHours ?? 0);
    return this.normalizeLegacyTarget(value);
  }

  private resolveCurrentKilowattHours(primary: number | undefined, legacyMisnamedKilowattHours: number | undefined): number {
    return Number(primary ?? legacyMisnamedKilowattHours ?? 0);
  }

  private normalizeLegacyTarget(value: number): number {
    if (Number.isInteger(value) && value >= 100 && value <= 10000) {
      return Number((value / 1000).toFixed(6));
    }

    return value;
  }
}
