import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';

export interface ConsumptionReportResponse extends BaseResponse<number> {
  userId: number;
  totalWatts: number;
  averageWatts: number;
  highestWatts: number;
  startDate: string;
  endDate: string;
}