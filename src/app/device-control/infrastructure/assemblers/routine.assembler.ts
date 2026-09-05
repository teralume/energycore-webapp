import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { Routine } from '../../domain/model/routine.entity';
import { RoutineResource } from '../resources/routine.resource';
import { RoutineResponse } from '../responses/routine.response';

export class RoutineAssembler extends BaseAssembler<
  Routine,
  RoutineResource,
  RoutineResponse
> {
  override toEntity(response: RoutineResponse): Routine {
    return new Routine({
      id: response.id,
      userId: response.userId,
      deviceId: response.deviceId ?? null,
      groupId: response.groupId ?? null,
      targetType: response.targetType ?? (response.groupId ? 'GROUP' : 'DEVICE'),
      targetId: response.targetId ?? response.groupId ?? response.deviceId ?? 0,
      targetName: response.targetName ?? '',
      name: response.name,
      action: response.action,
      time: response.time,
      repeatType: response.repeatType ?? 'DAILY',
      daysOfWeek: response.daysOfWeek ?? '',
      intervalDays: response.intervalDays ?? 1,
      startsOn: response.startsOn ?? null,
      applicableDeviceCount: response.applicableDeviceCount ?? 0,
      blockedDeviceCount: response.blockedDeviceCount ?? 0,
      enabled: response.enabled,
    });
  }

  override toResource(entity: Routine): RoutineResource {
    return {
      userId: entity.userId,
      deviceId: entity.deviceId,
      groupId: entity.groupId,
      targetType: entity.targetType,
      targetId: entity.targetId,
      name: entity.name,
      action: entity.action,
      time: entity.time,
      repeatType: entity.repeatType,
      daysOfWeek: entity.daysOfWeek,
      intervalDays: entity.intervalDays,
      startsOn: entity.startsOn,
      enabled: entity.enabled,
    };
  }
}
