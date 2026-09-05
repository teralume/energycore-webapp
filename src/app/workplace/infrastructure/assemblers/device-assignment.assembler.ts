import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { DeviceAssignment } from '../../domain/model/device-assignment.entity';
import { DeviceAssignmentResource } from '../resources/device-assignment.resource';
import { DeviceAssignmentResponse } from '../responses/device-assignment.response';

export class DeviceAssignmentAssembler extends BaseAssembler<
  DeviceAssignment,
  DeviceAssignmentResource,
  DeviceAssignmentResponse
> {
  override toEntity(response: DeviceAssignmentResponse): DeviceAssignment {
    return new DeviceAssignment({
      id: response.id,
      userId: response.userId,
      deviceId: response.deviceId,
      locationId: response.locationId,
      roomId: response.roomId,
      assignedAt: response.assignedAt,
    });
  }

  override toResource(entity: DeviceAssignment): DeviceAssignmentResource {
    return {
      userId: entity.userId,
      deviceId: entity.deviceId,
      locationId: entity.locationId,
      roomId: entity.roomId,
      assignedAt: entity.assignedAt,
    };
  }
}