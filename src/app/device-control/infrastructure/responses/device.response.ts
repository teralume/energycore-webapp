import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import {
  DeviceStatus,
  DeviceType,
} from '../../domain/model/device.entity';

export interface DeviceResponse extends BaseResponse<number> {
  userId: number;
  name: string;
  room?: string | null;
  type: DeviceType;
  powerWatts: number;
  status: DeviceStatus;
  createdAt: string;
}
