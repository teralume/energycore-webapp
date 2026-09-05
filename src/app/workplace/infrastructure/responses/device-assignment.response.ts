import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';

export interface DeviceAssignmentResponse extends BaseResponse<number> {
  userId: number;
  deviceId: number;
  locationId: number;
  roomId?: number | null;
  assignedAt: string;
}
