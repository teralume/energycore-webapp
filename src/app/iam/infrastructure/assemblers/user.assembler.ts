import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { User } from '../../domain/model/user.entity';
import { UserResource } from '../resources/user.resource';
import { UserResponse } from '../responses/user.response';

export class UserAssembler extends BaseAssembler<
  User,
  UserResource,
  UserResponse
> {
  override toEntity(response: UserResponse): User {
    return new User({
      id: response.id,
      fullName: response.fullName,
      email: response.email,
      accessProfileId: response.accessProfileId,
      accessProfileName: response.accessProfileName,
      status: response.status,
      createdAt: response.createdAt,
    });
  }

  override toResource(entity: User): UserResource {
    return {
      fullName: entity.fullName,
      email: entity.email,
      accessProfileId: entity.accessProfileId,
    };
  }
}
