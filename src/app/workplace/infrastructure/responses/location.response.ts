import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import { LocationType } from '../../domain/model/location.entity';

export interface LocationResponse extends BaseResponse<number> {
  userId: number;
  name: string;
  address: string;
  type: LocationType;
  createdAt: string;
}