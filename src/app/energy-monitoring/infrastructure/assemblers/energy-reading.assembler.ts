import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';

import {
  EnergyReading,
  EnergyReadingStatus,
} from '../../domain/model/energy-reading.entity';
import { EnergyReadingResource } from '../resources/energy-reading.resource';
import { EnergyReadingResponse } from '../responses/energy-reading.response';

export class EnergyReadingAssembler extends BaseAssembler<
  EnergyReading,
  EnergyReadingResource,
  EnergyReadingResponse
> {
  override toEntity(response: EnergyReadingResponse): EnergyReading {
    const watts = Number(response.watts ?? 0);

    const status: EnergyReadingStatus =
      response.status ?? (watts >= 1800 ? 'HIGH' : 'NORMAL');

    return new EnergyReading({
      id: response.id,
      userId: response.userId,
      deviceId: response.deviceId,
      deviceName: response.deviceName,
      watts,
      kilowattHours: Number(response.kilowattHours ?? 0),
      estimatedCost: Number(response.estimatedCost ?? 0),
      sampleSeconds: Number(response.sampleSeconds ?? 0),
      recordedAt: response.recordedAt,
      status,
    });
  }

  override toResource(entity: EnergyReading): EnergyReadingResource {
    return {
      userId: entity.userId,
      deviceId: entity.deviceId,
      deviceName: entity.deviceName,
      watts: entity.watts,
      kilowattHours: entity.kilowattHours,
      estimatedCost: entity.estimatedCost,
      sampleSeconds: entity.sampleSeconds,
      recordedAt: entity.recordedAt,
      status: entity.status,
    };
  }
}