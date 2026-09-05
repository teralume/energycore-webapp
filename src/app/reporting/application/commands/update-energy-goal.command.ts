export interface UpdateEnergyGoalCommand {
  goalId: number;
  title: string;
  targetKilowattHours: number;
  currentKilowattHours: number;
  deadline: string;
  scopeType?: 'GENERAL' | 'WORKPLACE' | 'ROOM' | 'DEVICE' | 'GROUP';
  scopeId?: number | null;
  scopeName?: string | null;
  activeFrom?: string | null;
  activeTo?: string | null;
}
