import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-metrics-cards',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './metrics-cards.component.html',
  styleUrls: ['./metrics-cards.component.scss'],
})
export class MetricsCardsComponent {
  @Input() totalWatts = 0;
  @Input() averageWatts = 0;
  @Input() highestWatts = 0;
  @Input() highReadings = 0;
}