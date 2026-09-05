import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';

export interface RoomResponse extends BaseResponse<number> {
  userId: number;
  locationId: number;
  name: string;
  floor: string;
  createdAt: string;
}