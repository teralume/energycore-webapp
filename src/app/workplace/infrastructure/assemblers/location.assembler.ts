import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { Location } from '../../domain/model/location.entity';
import { LocationResource } from '../resources/location.resource';
import { LocationResponse } from '../responses/location.response';

export class LocationAssembler extends BaseAssembler<
  Location,
  LocationResource,
  LocationResponse
> {
  override toEntity(response: LocationResponse): Location {
    return new Location({
      id: response.id,
      userId: response.userId,
      name: response.name,
      address: response.address,
      type: response.type,
      createdAt: response.createdAt ?? '',
    });
  }

  override toResource(entity: Location): LocationResource {
    return {
      userId: entity.userId,
      name: entity.name,
      address: entity.address,
      type: entity.type,
      createdAt: entity.createdAt,
    };
  }
}
