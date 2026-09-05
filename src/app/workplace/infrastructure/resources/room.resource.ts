import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';

export interface RoomResource extends BaseResource {
  userId?: number;
  locationId: number;
  name: string;
  floor: string;
  createdAt: string;
}
