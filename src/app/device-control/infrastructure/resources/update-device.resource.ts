import { DeviceType } from '../../domain/model/device.entity';

export interface UpdateDeviceResource {
  name: string;
  room?: string | null;
  type: DeviceType;
  powerWatts: number;
}
