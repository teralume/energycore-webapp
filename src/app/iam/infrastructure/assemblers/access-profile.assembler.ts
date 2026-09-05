import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { AccessProfile } from '../../domain/model/access-profile.entity';
import { AccessProfileResource } from '../resources/access-profile.resource';
import { AccessProfileResponse } from '../responses/access-profile.response';

export class AccessProfileAssembler extends BaseAssembler<
  AccessProfile,
  AccessProfileResource,
  AccessProfileResponse
> {
  override toEntity(response: AccessProfileResponse): AccessProfile {
    return new AccessProfile({
      id: response.id,
      name: response.name,
      description: response.description,
      permissions: response.permissions ?? [],
    });
  }

  override toResource(entity: AccessProfile): AccessProfileResource {
    return {
      name: entity.name,
      description: entity.description,
      permissions: entity.permissions,
    };
  }
}
