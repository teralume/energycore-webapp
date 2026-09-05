import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';

export interface SignInResource extends BaseResource {
  email: string;
  password: string;
}