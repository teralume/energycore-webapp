import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import { LocationType } from '../../domain/model/location.entity';

export interface LocationResource extends BaseResource {
  userId?: number;
  name: string;
  address: string;
  type: LocationType;
  createdAt: string;
}
