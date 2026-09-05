import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';

export interface UserResource extends BaseResource {
  fullName: string;
  email: string;
  accessProfileId?: number;
}