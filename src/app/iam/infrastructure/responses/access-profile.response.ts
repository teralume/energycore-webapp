import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import { AccessPermission } from '../../domain/model/access-permission.model';
import { AccessProfileName } from '../../domain/model/access-profile.entity';

export interface AccessProfileResponse extends BaseResponse<number> {
  name: AccessProfileName;
  description: string;
  permissions: AccessPermission[];
}
