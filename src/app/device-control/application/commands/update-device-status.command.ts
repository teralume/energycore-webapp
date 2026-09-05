import { DeviceStatus } from '../../domain/model/device.entity';

export interface UpdateDeviceStatusCommand {
  deviceId: number;
  status: DeviceStatus;
}
