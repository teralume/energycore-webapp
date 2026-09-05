import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';

export interface DeviceAssignmentResource extends BaseResource {
  userId?: number;
  deviceId: number;
  locationId: number;
  roomId?: number | null;
  assignedAt: string;
}
