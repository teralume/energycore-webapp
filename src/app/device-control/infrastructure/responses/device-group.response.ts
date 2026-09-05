import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';

export interface DeviceGroupResponse extends BaseResponse<number> {
  userId: number;
  name: string;
  description?: string | null;
  deviceIds?: number[] | null;
  createdAt?: string | null;
}