import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';

export interface SignUpResource extends BaseResource {
  fullName: string;
  email: string;
  password: string;
}