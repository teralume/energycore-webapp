import { SlicePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { EnergyReading } from '../../../domain/model/energy-reading.entity';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';

@Component({
  selector: 'app-usage-chart',
  standalone: true,
  imports: [EmptyStateComponent, TranslateModule, SlicePipe],
  templateUrl: './usage-chart.component.html',
  styleUrls: ['./usage-chart.component.scss'],
})
export class UsageChartComponent {
  @Input() readings: EnergyReading[] = [];

  get maxWatts(): number {
    if (this.readings.length === 0) return 1;

    return Math.max(...this.readings.map((reading) => reading.watts));
  }

  get chartReadings(): EnergyReading[] {
    return [...this.readings].reverse().slice(-12);
  }

  getHeight(watts: number): number {
    return Math.max(8, Math.round((watts / this.maxWatts) * 160));
  }
}
