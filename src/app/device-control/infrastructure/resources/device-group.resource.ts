import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';

export interface DeviceGroupResource extends BaseResource {
  userId?: number;
  name: string;
  description: string;
  deviceIds: number[];
  createdAt: string;
}
