import { DeviceType } from '../../domain/model/device.entity';

export interface CreateDeviceCommand {
  name: string;
  room?: string | null;
  type: DeviceType;
  powerWatts: number;
}
