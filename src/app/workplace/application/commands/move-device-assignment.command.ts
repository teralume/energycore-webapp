export interface MoveDeviceAssignmentCommand {
  assignmentId: number;
  locationId: number;
  roomId?: number | null;
}
