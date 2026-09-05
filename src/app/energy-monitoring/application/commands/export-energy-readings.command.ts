import { EnergyReading } from '../../domain/model/energy-reading.entity';

export interface ExportEnergyReadingsCommand {
  fileName: string;
  readings?: EnergyReading[];
}
