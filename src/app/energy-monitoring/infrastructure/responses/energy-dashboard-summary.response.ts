export interface EnergyTrendPointResponse {
  label: string;
  deviceName: string;
  watts: number;
  kilowattHours: number;
  estimatedCost: number;
  sampleSeconds: number;
  high: boolean;
}

export interface EnergyDeviceConsumptionResponse {
  deviceId: number;
  name: string;
  room: string;
  type: string;
  watts: number;
  kilowattHours: number;
  estimatedCost: number;
  readings: number;
  highReadings: number;
}

export interface EnergyRoomConsumptionResponse {
  room: string;
  watts: number;
  kilowattHours: number;
  estimatedCost: number;
  activeDevices: number;
}

export interface EnergyActiveDeviceResponse {
  deviceId: number;
  name: string;
  room: string;
  type: string;
  watts: number;
  costPerHour: number;
}

export interface EnergyDashboardSummaryResponse {
  currentWatts: number;
  todayKilowattHours: number;
  todayEstimatedCost: number;
  projectedMonthlyCost: number;
  costPerHour: number;
  peakWatts: number;
  averageWatts: number;
  activeDevices: number;
  monitoredDevices: number;
  normalReadings: number;
  highReadings: number;
  efficiencyScore: number;
  operationalStatus: string;
  recommendation: string;
  activeAlerts: number;
  criticalAlerts: number;
  latestAlertLevel: string | null;
  latestAlertTitle: string | null;
  trend: EnergyTrendPointResponse[];
  topDevices: EnergyDeviceConsumptionResponse[];
  rooms: EnergyRoomConsumptionResponse[];
  activeDeviceDetails: EnergyActiveDeviceResponse[];
}
