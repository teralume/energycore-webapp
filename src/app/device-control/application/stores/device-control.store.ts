import { Injectable, computed, signal } from '@angular/core';

import { Device } from '../../domain/model/device.entity';
import { DeviceGroup } from '../../domain/model/device-group.entity';
import { OperationMode } from '../../domain/model/operation-mode.entity';
import { Routine } from '../../domain/model/routine.entity';

@Injectable({
  providedIn: 'root',
})
export class DeviceControlStore {
  private readonly devicesSignal = signal<Device[]>([]);
  private readonly routinesSignal = signal<Routine[]>([]);
  private readonly deviceGroupsSignal = signal<DeviceGroup[]>([]);
  private readonly operationModesSignal = signal<OperationMode[]>([]);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly devices = computed(() => this.devicesSignal());
  readonly routines = computed(() => this.routinesSignal());
  readonly deviceGroups = computed(() => this.deviceGroupsSignal());
  readonly operationModes = computed(() => this.operationModesSignal());

  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly activeDevices = computed(() =>
    this.devicesSignal().filter((device) => device.isOn)
  );

  readonly totalCurrentWatts = computed(() =>
    this.activeDevices().reduce((total, device) => total + device.powerWatts, 0)
  );

  readonly enabledRoutines = computed(() =>
    this.routinesSignal().filter((routine) => routine.enabled)
  );

  setDevices(value: Device[]): void {
    this.devicesSignal.set(value);
  }

  prependDevice(value: Device): void {
    this.devicesSignal.update((devices) => [value, ...devices]);
  }

  updateDevice(value: Device): void {
    this.devicesSignal.update((devices) =>
      devices.map((device) => (device.id === value.id ? value : device))
    );
  }

  removeDevice(deviceId: number): void {
    this.devicesSignal.update((devices) =>
      devices.filter((device) => device.id !== deviceId)
    );

    this.routinesSignal.update((routines) =>
      routines.filter(
        (routine) =>
          !(
            routine.targetType === 'DEVICE' &&
            (routine.deviceId === deviceId || routine.targetId === deviceId)
          )
      )
    );

    this.deviceGroupsSignal.update((groups) =>
      groups.map(
        (group) =>
          new DeviceGroup({
            id: group.id,
            userId: group.userId,
            name: group.name,
            description: group.description,
            deviceIds: group.deviceIds.filter((id) => id !== deviceId),
            createdAt: group.createdAt,
          })
      )
    );
  }

  setRoutines(value: Routine[]): void {
    this.routinesSignal.set(value);
  }

  prependRoutine(value: Routine): void {
    this.routinesSignal.update((routines) => [value, ...routines]);
  }

  updateRoutine(value: Routine): void {
    this.routinesSignal.update((routines) =>
      routines.map((routine) => (routine.id === value.id ? value : routine))
    );
  }

  removeRoutine(routineId: number): void {
    this.routinesSignal.update((routines) =>
      routines.filter((routine) => routine.id !== routineId)
    );
  }

  setDeviceGroups(value: DeviceGroup[]): void {
    this.deviceGroupsSignal.set(value);
  }

  prependDeviceGroup(value: DeviceGroup): void {
    this.deviceGroupsSignal.update((groups) => [value, ...groups]);
  }

  updateDeviceGroup(value: DeviceGroup): void {
    this.deviceGroupsSignal.update((groups) =>
      groups.map((group) => (group.id === value.id ? value : group))
    );
  }

  removeDeviceGroup(groupId: number): void {
    this.deviceGroupsSignal.update((groups) =>
      groups.filter((group) => group.id !== groupId)
    );
  }

  setOperationModes(value: OperationMode[]): void {
    this.operationModesSignal.set(value);
  }

  prependOperationMode(value: OperationMode): void {
    this.operationModesSignal.update((modes) => [value, ...modes]);
  }

  updateOperationMode(value: OperationMode): void {
    this.operationModesSignal.update((modes) =>
      modes.map((mode) => (mode.id === value.id ? value : mode))
    );
  }

  removeOperationMode(modeId: number): void {
    this.operationModesSignal.update((modes) =>
      modes.filter((mode) => mode.id !== modeId)
    );
  }

  setLoading(value: boolean): void {
    this.loadingSignal.set(value);
  }

  setError(value: string | null): void {
    this.errorSignal.set(value);
  }

  clearMessages(): void {
    this.errorSignal.set(null);
  }

  reset(): void {
    this.devicesSignal.set([]);
    this.routinesSignal.set([]);
    this.deviceGroupsSignal.set([]);
    this.operationModesSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
