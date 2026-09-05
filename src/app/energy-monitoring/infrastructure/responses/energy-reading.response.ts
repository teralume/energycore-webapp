import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import { EnergyReadingStatus } from '../../domain/model/energy-reading.entity';

export interface EnergyReadingResponse extends BaseResponse<number> {
  userId: number;
  deviceId: number;
  deviceName: string;
  watts: number;
  kilowattHours?: number;
  estimatedCost?: number;
  sampleSeconds?: number;
  recordedAt: string;
  status?: EnergyReadingStatus;
}