import { ConsumptionReportPeriod } from '../../domain/model/consumption-report.entity';

export interface CreateConsumptionReportCommand {
  title: string;
  period: ConsumptionReportPeriod;
  startDate: string;
  endDate: string;
}
