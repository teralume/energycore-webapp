import { Injectable } from '@angular/core';

import { ConsumptionReport } from '../model/consumption-report.entity';

@Injectable({
  providedIn: 'root',
})
export class ReportSummaryService {
  calculateTotalReportedWatts(reports: ConsumptionReport[]): number {
    return reports.reduce((total, report) => total + report.totalWatts, 0);
  }

  calculateAverageReportedWatts(reports: ConsumptionReport[]): number {
    if (reports.length === 0) return 0;

    const total = reports.reduce((sum, report) => sum + report.averageWatts, 0);
    return Number((total / reports.length).toFixed(2));
  }

  findHighestReport(reports: ConsumptionReport[]): ConsumptionReport | null {
    if (reports.length === 0) return null;

    return reports.reduce((highest, current) =>
      current.highestWatts > highest.highestWatts ? current : highest
    );
  }
}