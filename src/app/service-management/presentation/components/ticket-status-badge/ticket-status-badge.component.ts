import { Component, Input } from '@angular/core';

type BadgeVariant =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'PENDING'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT'
  | string;

@Component({
  selector: 'app-ticket-status-badge',
  standalone: true,
  templateUrl: './ticket-status-badge.component.html',
  styleUrls: ['./ticket-status-badge.component.scss'],
})
export class TicketStatusBadgeComponent {
  @Input({ required: true }) value!: BadgeVariant;
  @Input() label: string | null = null;

  get normalizedValue(): string {
    return String(this.value).toLowerCase().replaceAll('_', '-');
  }

  get displayLabel(): string {
    return this.label ?? String(this.value).replaceAll('_', ' ');
  }
}