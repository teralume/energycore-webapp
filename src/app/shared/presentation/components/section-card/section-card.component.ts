import { Component, Input } from '@angular/core';

export type SectionCardSize = 'large' | 'medium' | 'small' | 'description';

@Component({
  selector: 'app-section-card',
  standalone: true,
  templateUrl: './section-card.component.html',
  styleUrls: ['./section-card.component.scss'],
})
export class SectionCardComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() description = '';
  @Input() size: SectionCardSize = 'medium';

  get className(): string {
    return `section-card section-card--${this.size}`;
  }
}
