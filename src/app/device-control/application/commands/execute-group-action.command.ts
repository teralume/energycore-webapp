import { DeviceStatus } from '../../domain/model/device.entity';

export interface ExecuteGroupActionCommand {
  groupId: number;
  status: DeviceStatus;
}
