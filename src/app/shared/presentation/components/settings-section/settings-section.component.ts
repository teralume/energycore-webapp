import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-settings-section',
  standalone: true,
  templateUrl: './settings-section.component.html',
  styleUrls: ['./settings-section.component.scss'],
})
export class SettingsSectionComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() description = '';
  @Input() stackedHeader = false;
}
