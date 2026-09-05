import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import { ConsumptionReport } from '../../domain/model/consumption-report.entity';
import { ConsumptionReportResource } from '../resources/consumption-report.resource';
import { ConsumptionReportResponse } from '../responses/consumption-report.response';

export class ConsumptionReportAssembler extends BaseAssembler<
  ConsumptionReport,
  ConsumptionReportResource,
  ConsumptionReportResponse
> {
  override toEntity(response: ConsumptionReportResponse): ConsumptionReport {
    const startDate = response.startDate;
    const endDate = response.endDate;
    const period = this.resolvePeriod(startDate, endDate);

    return new ConsumptionReport({
      id: response.id,
      userId: response.userId,
      title: `Reporte ${startDate} / ${endDate}`,
      period,
      totalWatts: response.totalWatts,
      averageWatts: response.averageWatts,
      highestWatts: response.highestWatts,
      startDate,
      endDate,
      generatedAt: endDate,
    });
  }

  override toResource(entity: ConsumptionReport): ConsumptionReportResource {
    return {
      userId: entity.userId,
      startDate: entity.startDate,
      endDate: entity.endDate,
    };
  }

  private resolvePeriod(
    startDate: string,
    endDate: string
  ): ConsumptionReport['period'] {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    const days =
      Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    if (days <= 1) return 'DAILY';
    if (days <= 7) return 'WEEKLY';
    if (days >= 365) return 'YEARLY';

    return 'MONTHLY';
  }
}