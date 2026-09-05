import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UiPreferencesService } from '../../../../shared/application/services/ui-preferences.service';
import { DeviceGroup } from '../../../domain/model/device-group.entity';
import { Device, DeviceStatus, DeviceType } from '../../../domain/model/device.entity';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';

type GroupPowerTransition = 'powering-on' | 'powering-off' | null;

const localeByLanguage: Record<string, string> = {
  es: 'es-PE',
  en: 'en-US',
  pt: 'pt-BR',
};

@Component({
  selector: 'app-device-group-card',
  standalone: true,
  imports: [TranslateModule, AppButtonComponent],
  templateUrl: './device-group-card.component.html',
  styleUrls: ['./device-group-card.component.scss'],
})
export class DeviceGroupCardComponent implements OnDestroy {
  @Input({ required: true }) group!: DeviceGroup;
  @Input() devices: Device[] = [];
  @Input() roomName = '';
  @Input() removing = false;

  @Output() execute = new EventEmitter<{
    groupId: number;
    status: DeviceStatus;
  }>();

  @Output() remove = new EventEmitter<number>();

  powerTransition: GroupPowerTransition = null;

  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly translate: TranslateService,
    private readonly uiPreferences: UiPreferencesService
  ) {}

  ngOnDestroy(): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
  }

  get canExecute(): boolean {
    return this.group.hasDevices && !this.removing;
  }

  get activeDeviceCount(): number {
    return this.devices.filter((device) => device.isOn).length;
  }

  get currentWatts(): number {
    return this.devices.reduce(
      (total, device) => total + (device.isOn ? device.powerWatts : 0),
      0
    );
  }

  get hasActiveDevices(): boolean {
    return this.activeDeviceCount > 0;
  }

  get allDevicesOn(): boolean {
    return this.devices.length > 0 && this.activeDeviceCount === this.devices.length;
  }

  get groupStateLabel(): string {
    return this.translate.instant(this.groupStateLabelKey);
  }

  get groupStateLabelKey(): string {
    if (this.allDevicesOn) {
      return 'deviceGroups.state.on';
    }

    if (this.hasActiveDevices) {
      return 'deviceGroups.state.mixed';
    }

    return 'deviceGroups.state.off';
  }

  get formattedCreatedAt(): string {
    if (!this.group.createdAt) {
      return this.translate.instant('deviceGroups.card.noDate');
    }

    const date = new Date(this.group.createdAt);

    if (Number.isNaN(date.getTime())) {
      return this.group.createdAt;
    }

    return date.toLocaleDateString(this.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getDeviceIcon(type: DeviceType): string {
    const icons: Record<DeviceType, string> = {
      PLUG: '🔌',
      LIGHT: '💡',
      SWITCH: '🔘',
      SENSOR: '📡',
      OTHER: '⚡',
    };

    return icons[type] ?? '⚡';
  }

  getDeviceTypeLabel(type: DeviceType): string {
    return this.translate.instant(this.getDeviceTypeLabelKey(type));
  }

  getDeviceTypeLabelKey(type: DeviceType): string {
    const labels: Record<DeviceType, string> = {
      PLUG: 'workplace.deviceTypes.plug',
      LIGHT: 'workplace.deviceTypes.light',
      SWITCH: 'workplace.deviceTypes.switch',
      SENSOR: 'workplace.deviceTypes.sensor',
      OTHER: 'workplace.deviceTypes.other',
    };

    return labels[type];
  }

  getDeviceStatusLabel(device: Device): string {
    return this.translate.instant(this.getDeviceStatusLabelKey(device));
  }

  getDeviceStatusLabelKey(device: Device): string {
    if (device.isOn) return 'devices.status.on';
    if (device.isOff) return 'devices.status.off';
    if (device.isInMaintenance) return 'devices.status.maintenance';
    return 'devices.status.removed';
  }

  turnOn(): void {
    if (!this.canExecute) {
      return;
    }

    this.playPowerTransition('powering-on');
    this.execute.emit({
      groupId: this.group.id,
      status: 'ON',
    });
  }

  turnOff(): void {
    if (!this.canExecute) {
      return;
    }

    this.playPowerTransition('powering-off');
    this.execute.emit({
      groupId: this.group.id,
      status: 'OFF',
    });
  }

  onRemove(): void {
    if (this.removing) {
      return;
    }

    this.remove.emit(this.group.id);
  }

  private playPowerTransition(state: Exclude<GroupPowerTransition, null>): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }

    this.powerTransition = state;
    this.transitionTimer = setTimeout(() => {
      this.powerTransition = null;
      this.transitionTimer = null;
    }, 760);
  }

  private currentLocale(): string {
    return localeByLanguage[this.uiPreferences.currentLanguage()] ?? localeByLanguage['es'];
  }
}
