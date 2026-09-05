export interface AssignDeviceCommand {
  deviceId: number;
  locationId: number;
  roomId?: number | null;
}
