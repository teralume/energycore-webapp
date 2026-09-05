import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { Device, DeviceType } from '../../../domain/model/device.entity';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';

type PowerTransition = 'powering-on' | 'powering-off' | null;

@Component({
  selector: 'app-device-card',
  standalone: true,
  imports: [TranslateModule, AppButtonComponent],
  templateUrl: './device-card.component.html',
  styleUrls: ['./device-card.component.scss'],
})
export class DeviceCardComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) device!: Device;
  @Input() locationName = '';
  @Input() roomName = '';
  @Input() removing = false;
  @Input() canControlDevices = false;
  @Input() canManageDevices = false;

  @Output() toggle = new EventEmitter<Device>();
  @Output() rename = new EventEmitter<Device>();
  @Output() remove = new EventEmitter<number>();

  powerTransition: PowerTransition = null;

  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    const deviceChange = changes['device'];
    const previous = deviceChange?.previousValue as Device | undefined;
    const current = deviceChange?.currentValue as Device | undefined;

    if (
      !previous ||
      !current ||
      previous.id !== current.id ||
      previous.isOn === current.isOn
    ) {
      return;
    }

    this.playPowerTransition(current.isOn ? 'powering-on' : 'powering-off');
  }

  ngOnDestroy(): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
  }

  get deviceIcon(): string {
    const icons: Record<DeviceType, string> = {
      PLUG: '🔌',
      LIGHT: '💡',
      SWITCH: '🔘',
      SENSOR: '📡',
      OTHER: '⚡',
    };

    return icons[this.device.type] ?? '⚡';
  }

  get deviceTypeLabel(): string {
    return this.deviceTypeLabelKey;
  }

  get deviceTypeLabelKey(): string {
    const labels: Record<DeviceType, string> = {
      PLUG: 'workplace.deviceTypes.plug',
      LIGHT: 'workplace.deviceTypes.light',
      SWITCH: 'workplace.deviceTypes.switch',
      SENSOR: 'workplace.deviceTypes.sensor',
      OTHER: 'workplace.deviceTypes.other',
    };

    return labels[this.device.type];
  }

  get statusLabel(): string {
    return this.statusLabelKey;
  }

  get statusLabelKey(): string {
    if (this.device.isOn) {
      return 'devices.status.on';
    }

    if (this.device.isOff) {
      return 'devices.status.off';
    }

    if (this.device.isInMaintenance) {
      return 'devices.status.maintenance';
    }

    return 'devices.status.removed';
  }

  onToggle(): void {
    if (this.removing || !this.canControlDevices || !this.device.canReceiveOperationalChanges) {
      return;
    }

    this.toggle.emit(this.device);
  }

  onRemove(): void {
    if (this.removing || !this.canManageDevices) {
      return;
    }

    this.remove.emit(this.device.id);
  }

  onRename(): void {
    if (this.removing || !this.canManageDevices) {
      return;
    }

    this.rename.emit(this.device);
  }

  private playPowerTransition(state: Exclude<PowerTransition, null>): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }

    this.powerTransition = state;
    this.transitionTimer = setTimeout(() => {
      this.powerTransition = null;
      this.transitionTimer = null;
    }, 740);
  }
}
