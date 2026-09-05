export interface UpdateDeviceGroupCommand {
  groupId: number;
  name: string;
  description: string;
  deviceIds: number[];
}
