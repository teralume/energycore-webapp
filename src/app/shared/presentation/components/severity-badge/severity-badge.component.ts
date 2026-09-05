import { Component, Input } from '@angular/core';

export type SeverityBadgeLevel =
  | 'STABLE'
  | 'SUCCESS'
  | 'INFO'
  | 'WARNING'
  | 'CRITICAL';

@Component({
  selector: 'app-severity-badge',
  standalone: true,
  templateUrl: './severity-badge.component.html',
  styleUrls: ['./severity-badge.component.scss'],
})
export class SeverityBadgeComponent {
  @Input() level: SeverityBadgeLevel | string = 'INFO';

  get normalizedLevel(): SeverityBadgeLevel {
    const level = String(this.level || 'INFO').toUpperCase();

    if (['STABLE', 'SUCCESS', 'INFO', 'WARNING', 'CRITICAL'].includes(level)) {
      return level as SeverityBadgeLevel;
    }

    return 'INFO';
  }

  get label(): string {
    const labels: Record<SeverityBadgeLevel, string> = {
      STABLE: 'Estable',
      SUCCESS: 'Exito',
      INFO: 'Info',
      WARNING: 'Atencion',
      CRITICAL: 'Critico',
    };

    return labels[this.normalizedLevel];
  }
}
