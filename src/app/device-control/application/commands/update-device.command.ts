import { DeviceType } from '../../domain/model/device.entity';

export interface UpdateDeviceCommand {
  deviceId: number;
  name: string;
  room?: string | null;
  type: DeviceType;
  powerWatts: number;
}
