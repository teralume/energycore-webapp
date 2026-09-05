import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';

export interface ConsumptionReportResource extends BaseResource {
  userId?: number;
  startDate: string;
  endDate: string;
}
