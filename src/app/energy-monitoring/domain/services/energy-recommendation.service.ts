import { Injectable } from '@angular/core';

import { EnergyReading } from '../model/energy-reading.entity';
import { EnergyStatisticsService } from './energy-statistics.service';

@Injectable({
  providedIn: 'root',
})
export class EnergyRecommendationService {
  constructor(private readonly statisticsService: EnergyStatisticsService) {}

  getRecommendationKey(readings: EnergyReading[]): string {
    if (readings.length === 0) {
      return 'energy.noDataRecommendation';
    }

    const average = this.statisticsService.calculateAverageWatts(readings);
    const highReadings = this.statisticsService.countHighReadings(readings);

    if (average >= 1000 || highReadings >= 5) {
      return 'energy.highRecommendation';
    }

    if (average >= 500 || highReadings >= 2) {
      return 'energy.moderateRecommendation';
    }

    return 'energy.lowRecommendation';
  }
}