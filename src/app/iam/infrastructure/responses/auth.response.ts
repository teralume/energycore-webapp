import { UserResponse } from './user.response';

export interface AuthResponse {
  user: UserResponse;
  token: string;
  message?: string;
}
