import { EnergyReading } from '../model/energy-reading.entity';
import { EnergyStatisticsService } from './energy-statistics.service';

describe('EnergyStatisticsService', () => {
  const service = new EnergyStatisticsService();
  const readings = [
    new EnergyReading({
      id: 1,
      userId: 7,
      deviceId: 10,
      deviceName: 'Office HVAC',
      watts: 900,
      recordedAt: '2026-09-15T12:00:00Z',
      status: 'HIGH',
    }),
    new EnergyReading({
      id: 2,
      userId: 7,
      deviceId: 11,
      deviceName: 'Office lights',
      watts: 100,
      recordedAt: '2026-09-15T12:01:00Z',
      status: 'NORMAL',
    }),
  ];

  it('calculates totals, averages, and the highest reading', () => {
    expect(service.calculateTotalWatts(readings)).toBe(1000);
    expect(service.calculateAverageWatts(readings)).toBe(500);
    expect(service.findHighestReading(readings)?.deviceName).toBe('Office HVAC');
  });

  it('separates high and normal readings', () => {
    expect(service.countHighReadings(readings)).toBe(1);
    expect(service.countNormalReadings(readings)).toBe(1);
  });
});
