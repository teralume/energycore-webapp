import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import {
  DeviceStatus,
  DeviceType,
} from '../../domain/model/device.entity';

export interface DeviceResource extends BaseResource {
  userId?: number;
  name: string;
  room?: string | null;
  type: DeviceType;
  powerWatts: number;
  status: DeviceStatus;
  createdAt: string;
}
