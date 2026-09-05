import { LocationType } from '../../domain/model/location.entity';

export interface CreateLocationCommand {
  name: string;
  address: string;
  type: LocationType;
}
