import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { Device } from '../../domain/model/device.entity';
import { DeviceResource } from '../resources/device.resource';
import { DeviceResponse } from '../responses/device.response';

export class DeviceAssembler extends BaseAssembler<
  Device,
  DeviceResource,
  DeviceResponse
> {
  override toEntity(response: DeviceResponse): Device {
    return new Device({
      id: response.id,
      userId: response.userId,
      name: response.name,
      room: response.room,
      type: response.type,
      powerWatts: response.powerWatts,
      status: response.status,
      createdAt: response.createdAt,
    });
  }

  override toResource(entity: Device): DeviceResource {
    return {
      userId: entity.userId,
      name: entity.name,
      room: entity.room,
      type: entity.type,
      powerWatts: entity.powerWatts,
      status: entity.status,
      createdAt: entity.createdAt,
    };
  }
}