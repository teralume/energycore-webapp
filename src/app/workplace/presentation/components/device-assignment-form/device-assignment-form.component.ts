import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Device } from '../../../../device-control/domain/model/device.entity';
import { AssignDeviceCommand } from '../../../application/commands/assign-device.command';
import { Location } from '../../../domain/model/location.entity';
import { Room } from '../../../domain/model/room.entity';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';

@Component({
  selector: 'app-device-assignment-form',
  standalone: true,
  imports: [FormsModule, TranslateModule, AppButtonComponent, AppDropdownComponent],
  templateUrl: './device-assignment-form.component.html',
  styleUrls: ['./device-assignment-form.component.scss'],
})
export class DeviceAssignmentFormComponent implements OnChanges {
  @Input() devices: Device[] = [];
  @Input() locations: Location[] = [];
  @Input() rooms: Room[] = [];
  @Input() loading = false;

  @Output() assigned = new EventEmitter<AssignDeviceCommand>();

  deviceId: number | null = null;
  locationId: number | null = null;
  roomId: number | null = null;

  constructor(private readonly translate: TranslateService) {}

  ngOnChanges(): void {
    if (this.locations.length === 1 && this.locationId !== this.locations[0].id) {
      this.locationId = this.locations[0].id;
      this.onLocationChange();
    }
  }

  get availableRooms(): Room[] {
    if (!this.locationId) return [];

    return this.rooms.filter((room) => room.locationId === Number(this.locationId));
  }

  get deviceValue(): string | null {
    return this.deviceId ? String(this.deviceId) : null;
  }

  get locationValue(): string | null {
    return this.locationId ? String(this.locationId) : null;
  }

  get roomValue(): string {
    return this.roomId ? String(this.roomId) : 'none';
  }

  get deviceOptions(): DropdownOption[] {
    return this.devices.map((device) => ({
      label: device.name,
      value: String(device.id),
      description: `${this.deviceTypeLabel(device.type)} - ${device.powerWatts} W`,
    }));
  }

  get locationOptions(): DropdownOption[] {
    return this.locations.map((location) => ({
      label: location.name,
      value: String(location.id),
      description: location.address || this.t('workplace.assignments.form.operationalSite'),
    }));
  }

  get roomOptions(): DropdownOption[] {
    return [
      {
        label: 'none',
        labelKey: 'workplace.assignments.noRoom',
        value: 'none',
        description: 'site-only',
        descriptionKey: 'workplace.assignments.form.siteOnly',
      },
      ...this.availableRooms.map((room) => ({
        label: room.name,
        value: String(room.id),
        description: this.t('workplace.assignments.form.availableRoom'),
      })),
    ];
  }

  deviceTypeLabel(type: Device['type']): string {
    const labelKeys: Record<Device['type'], string> = {
      PLUG: 'workplace.deviceTypes.plug',
      LIGHT: 'workplace.deviceTypes.light',
      SWITCH: 'workplace.deviceTypes.switch',
      SENSOR: 'workplace.deviceTypes.sensor',
      OTHER: 'workplace.deviceTypes.other',
    };

    return this.t(labelKeys[type]);
  }

  selectDevice(value: string): void {
    const deviceId = Number(value);
    this.deviceId = Number.isFinite(deviceId) ? deviceId : null;
  }

  selectLocation(value: string): void {
    const locationId = Number(value);
    this.locationId = Number.isFinite(locationId) ? locationId : null;
    this.onLocationChange();
  }

  selectRoom(value: string): void {
    if (value === 'none') {
      this.roomId = null;
      return;
    }

    const roomId = Number(value);
    this.roomId = Number.isFinite(roomId) ? roomId : null;
  }

  onLocationChange(): void {
    const roomStillAvailable = this.availableRooms.some(
      (room) => room.id === Number(this.roomId)
    );

    if (!roomStillAvailable) {
      this.roomId = null;
    }
  }

  onSubmit(): void {
    if (!this.deviceId || !this.locationId) return;

    this.assigned.emit({
      deviceId: Number(this.deviceId),
      locationId: Number(this.locationId),
      roomId: this.roomId ? Number(this.roomId) : null,
    });

    this.deviceId = null;
    this.locationId = null;
    this.roomId = null;
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
