import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-setting-toggle',
  standalone: true,
  templateUrl: './setting-toggle.component.html',
  styleUrls: ['./setting-toggle.component.scss'],
})
export class SettingToggleComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() checked = false;
  @Input() disabled = false;

  @Output() checkedChange = new EventEmitter<boolean>();

  toggle(): void {
    if (this.disabled) {
      return;
    }

    this.checkedChange.emit(!this.checked);
  }
}
