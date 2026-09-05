import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';

export interface UserResponse extends BaseResponse<number> {
  fullName: string;
  email: string;
  accessProfileId: number;
  accessProfileName: string;
  status: string;
  createdAt: string;
}
