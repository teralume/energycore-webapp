import { Injectable } from '@angular/core';

import { EnergyReading } from '../model/energy-reading.entity';

@Injectable({
  providedIn: 'root',
})
export class EnergyStatisticsService {
  calculateTotalWatts(readings: EnergyReading[]): number {
    return readings.reduce((total, reading) => total + reading.watts, 0);
  }

  calculateAverageWatts(readings: EnergyReading[]): number {
    if (readings.length === 0) return 0;

    const total = this.calculateTotalWatts(readings);
    return Number((total / readings.length).toFixed(2));
  }

  findHighestReading(readings: EnergyReading[]): EnergyReading | null {
    if (readings.length === 0) return null;

    return readings.reduce((highest, current) =>
      current.watts > highest.watts ? current : highest
    );
  }

  countHighReadings(readings: EnergyReading[]): number {
    return readings.filter((reading) => reading.isHigh).length;
  }

  countNormalReadings(readings: EnergyReading[]): number {
    return readings.filter((reading) => reading.isNormal).length;
  }

  groupByDevice(readings: EnergyReading[]): Record<string, number> {
    return readings.reduce<Record<string, number>>((result, reading) => {
      result[reading.deviceName] = (result[reading.deviceName] ?? 0) + reading.watts;
      return result;
    }, {});
  }
}