import { TranslateModule } from '@ngx-translate/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Device } from '../../../domain/model/device.entity';
import { DeviceCardComponent } from '../device-card/device-card.component';

interface DeviceRoomGroup {
  roomName: string;
  devices: Device[];
  activeCount: number;
  currentWatts: number;
}

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [
    TranslateModule,DeviceCardComponent],
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss'],
})
export class DeviceListComponent {
  @Input() devices: Device[] = [];
  @Input() locationName = '';
  @Input() roomNamesByDeviceId = new Map<number, string>();
  @Input() removingDeviceIds = new Set<number>();
  @Input() canControlDevices = false;
  @Input() canManageDevices = false;

  @Output() toggle = new EventEmitter<Device>();
  @Output() rename = new EventEmitter<Device>();
  @Output() remove = new EventEmitter<number>();

  get roomGroups(): DeviceRoomGroup[] {
    const groups = new Map<string, Device[]>();

    for (const device of this.devices) {
      const roomName = this.roomNameForDevice(device);
      const roomDevices = groups.get(roomName) ?? [];
      roomDevices.push(device);
      groups.set(roomName, roomDevices);
    }

    return [...groups.entries()]
      .map(([roomName, devices]) => ({
        roomName,
        devices,
        activeCount: devices.filter((device) => device.isOn).length,
        currentWatts: devices.reduce(
          (total, device) => total + (device.isOn ? device.powerWatts : 0),
          0
        ),
      }))
      .sort((left, right) => left.roomName.localeCompare(right.roomName));
  }

  isDeviceRemoving(deviceId: number): boolean {
    return this.removingDeviceIds.has(deviceId);
  }

  roomNameForDevice(device: Device): string {
    return this.roomNamesByDeviceId.get(device.id)?.trim() || device.room?.trim() || '';
  }
}
