import { TranslateModule } from '@ngx-translate/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { SettingToggleComponent } from '../setting-toggle/setting-toggle.component';
import { WeightSliderComponent } from '../weight-slider/weight-slider.component';

@Component({
  selector: 'app-calibration-card',
  standalone: true,
  imports: [
    TranslateModule,SettingToggleComponent, WeightSliderComponent],
  templateUrl: './calibration-card.component.html',
  styleUrls: ['./calibration-card.component.scss'],
})
export class CalibrationCardComponent {
  @Input() source = '';
  @Input() title = '';
  @Input() description = '';
  @Input() metric = '';
  @Input() enabled = false;
  @Input() weight = 0;
  @Input() percent = 0;

  @Output() enabledChange = new EventEmitter<boolean>();
  @Output() weightChange = new EventEmitter<number>();
}
