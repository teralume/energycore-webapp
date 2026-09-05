import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { DeviceGroup } from '../../domain/model/device-group.entity';
import { DeviceGroupResource } from '../resources/device-group.resource';
import { DeviceGroupResponse } from '../responses/device-group.response';

export class DeviceGroupAssembler extends BaseAssembler<
  DeviceGroup,
  DeviceGroupResource,
  DeviceGroupResponse
> {
  override toEntity(response: DeviceGroupResponse): DeviceGroup {
    return new DeviceGroup({
      id: response.id,
      userId: response.userId,
      name: response.name,
      description: response.description ?? '',
      deviceIds: Array.isArray(response.deviceIds) ? response.deviceIds : [],
      createdAt:
        response.createdAt ?? new Date().toISOString().slice(0, 10),
    });
  }

  override toResource(entity: DeviceGroup): DeviceGroupResource {
    return {
      userId: entity.userId,
      name: entity.name,
      description: entity.description,
      deviceIds: entity.deviceIds,
      createdAt: entity.createdAt,
    };
  }
}