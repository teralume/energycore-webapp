import { LocationType } from '../../domain/model/location.entity';

export interface UpdateLocationCommand {
  locationId: number;
  name: string;
  address: string;
  type: LocationType;
}
