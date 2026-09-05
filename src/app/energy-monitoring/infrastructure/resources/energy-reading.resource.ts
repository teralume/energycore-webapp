import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import { EnergyReadingStatus } from '../../domain/model/energy-reading.entity';

export interface EnergyReadingResource extends BaseResource {
  userId?: number;
  deviceId: number;
  deviceName: string;
  watts: number;
  kilowattHours?: number;
  estimatedCost?: number;
  sampleSeconds?: number;
  recordedAt: string;
  status: EnergyReadingStatus;
}
