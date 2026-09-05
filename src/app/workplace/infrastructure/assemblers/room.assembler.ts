import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { Room } from '../../domain/model/room.entity';
import { RoomResource } from '../resources/room.resource';
import { RoomResponse } from '../responses/room.response';

export class RoomAssembler extends BaseAssembler<
  Room,
  RoomResource,
  RoomResponse
> {
  override toEntity(response: RoomResponse): Room {
    return new Room({
      id: response.id,
      userId: response.userId,
      locationId: response.locationId,
      name: response.name,
      floor: response.floor,
      createdAt: response.createdAt ?? '',
    });
  }

  override toResource(entity: Room): RoomResource {
    return {
      userId: entity.userId,
      locationId: entity.locationId,
      name: entity.name,
      floor: entity.floor,
      createdAt: entity.createdAt,
    };
  }
}
