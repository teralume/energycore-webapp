import { Component, computed, input } from '@angular/core';

export interface EnergyTrendChartItem {
  key: string;
  value: number;
  valueLabel: string;
  caption: string;
  title: string;
  subtitle: string;
  detail: string;
  ariaLabel: string;
  tone: 'default' | 'warning';
}

interface PlottedTrendPoint {
  item: EnergyTrendChartItem;
  x: number;
  y: number;
}

interface TrendAxisLabel {
  key: string;
  x: number;
  label: string;
}

@Component({
  selector: 'app-energy-trend-chart',
  standalone: true,
  templateUrl: './energy-trend-chart.component.html',
  styleUrls: ['./energy-trend-chart.component.scss'],
})
export class EnergyTrendChartComponent {
  private readonly width = 960;
  private readonly height = 320;
  private readonly left = 28;
  private readonly right = 18;
  private readonly top = 20;
  private readonly bottom = 48;

  readonly items = input.required<EnergyTrendChartItem[]>();
  readonly ariaLabel = input.required<string>();

  readonly gridLines = [0.2, 0.4, 0.6, 0.8].map((ratio) => ({
    key: ratio,
    y: this.top + (this.height - this.top - this.bottom) * ratio,
  }));

  readonly plottedPoints = computed<PlottedTrendPoint[]>(() => {
    const items = this.items();
    const maxValue = Math.max(...items.map((item) => item.value), 0.000001);
    const plotWidth = this.width - this.left - this.right;
    const plotHeight = this.height - this.top - this.bottom;

    return items.map((item, index) => ({
      item,
      x:
        items.length === 1
          ? this.left + plotWidth / 2
          : this.left + (index / (items.length - 1)) * plotWidth,
      y: this.top + (1 - item.value / maxValue) * plotHeight,
    }));
  });

  readonly linePoints = computed(() =>
    this.plottedPoints()
      .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(' '),
  );

  readonly areaPoints = computed(() => {
    const points = this.plottedPoints();
    const baseline = this.height - this.bottom;

    if (points.length === 0) {
      return '';
    }

    return [
      `${points[0].x.toFixed(2)},${baseline}`,
      ...points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`),
      `${points[points.length - 1].x.toFixed(2)},${baseline}`,
    ].join(' ');
  });

  readonly axisLabels = computed<TrendAxisLabel[]>(() => {
    const points = this.plottedPoints();
    const maxLabels = 6;

    if (points.length <= maxLabels) {
      return points.map((point) => ({
        key: point.item.key,
        x: point.x,
        label: point.item.detail,
      }));
    }

    const indices = new Set<number>();
    for (let index = 0; index < maxLabels; index += 1) {
      indices.add(Math.round((index / (maxLabels - 1)) * (points.length - 1)));
    }

    return [...indices].map((index) => ({
      key: points[index].item.key,
      x: points[index].x,
      label: points[index].item.detail,
    }));
  });
}
