import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import { AccessPermission } from '../../domain/model/access-permission.model';
import { AccessProfileName } from '../../domain/model/access-profile.entity';

export interface AccessProfileResource extends BaseResource {
  name: AccessProfileName;
  description: string;
  permissions?: AccessPermission[];
}
