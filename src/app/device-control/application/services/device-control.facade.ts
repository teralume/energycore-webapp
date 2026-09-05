import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { BillingFacade } from '../../../billing/application/services/billing.facade';
import { PlanPermissionService } from '../../../billing/domain/services/plan-permission.service';

import { Device, DeviceStatus } from '../../domain/model/device.entity';
import { DeviceGroup } from '../../domain/model/device-group.entity';
import { OperationMode, OperationModeActivation, OperationModePreview } from '../../domain/model/operation-mode.entity';
import { Routine } from '../../domain/model/routine.entity';

import { CreateDeviceCommand } from '../commands/create-device.command';
import { CreateDeviceGroupCommand } from '../commands/create-device-group.command';
import { CreateOperationModeCommand } from '../commands/create-operation-mode.command';
import { CreateRoutineCommand } from '../commands/create-routine.command';
import { ExecuteGroupActionCommand } from '../commands/execute-group-action.command';
import { PairDeviceCommand } from '../commands/pair-device.command';
import { UpdateDeviceGroupCommand } from '../commands/update-device-group.command';
import { UpdateDeviceCommand } from '../commands/update-device.command';
import { UpdateDeviceStatusCommand } from '../commands/update-device-status.command';
import { UpdateRoutineStatusCommand } from '../commands/update-routine-status.command';

import { DeviceGroupsApiService } from '../../infrastructure/api/device-groups-api.service';
import { DevicesApiService } from '../../infrastructure/api/devices-api.service';
import { OperationModesApiService } from '../../infrastructure/api/operation-modes-api.service';
import { RoutinesApiService } from '../../infrastructure/api/routines-api.service';

import { DeviceGroupAssembler } from '../../infrastructure/assemblers/device-group.assembler';
import { DeviceAssembler } from '../../infrastructure/assemblers/device.assembler';
import { OperationModeAssembler } from '../../infrastructure/assemblers/operation-mode.assembler';
import { RoutineAssembler } from '../../infrastructure/assemblers/routine.assembler';

import { DeviceGroupPolicyService } from '../../domain/services/device-group-policy.service';
import { RoutineConflictCheckerService } from '../../domain/services/routine-conflict-checker.service';

import { DeviceControlStore } from '../stores/device-control.store';

@Injectable({
  providedIn: 'root',
})
export class DeviceControlFacade {
  private readonly deviceAssembler = new DeviceAssembler();
  private readonly routineAssembler = new RoutineAssembler();
  private readonly deviceGroupAssembler = new DeviceGroupAssembler();
  private readonly operationModeAssembler = new OperationModeAssembler();

  get devices() {
    return this.store.devices;
  }

  get routines() {
    return this.store.routines;
  }

  get deviceGroups() {
    return this.store.deviceGroups;
  }

  get operationModes() {
    return this.store.operationModes;
  }

  get loading() {
    return this.store.loading;
  }

  get error() {
    return this.store.error;
  }

  get activeDevices() {
    return this.store.activeDevices;
  }

  get totalCurrentWatts() {
    return this.store.totalCurrentWatts;
  }

  get enabledRoutines() {
    return this.store.enabledRoutines;
  }

  constructor(
    private readonly devicesApi: DevicesApiService,
    private readonly routinesApi: RoutinesApiService,
    private readonly deviceGroupsApi: DeviceGroupsApiService,
    private readonly operationModesApi: OperationModesApiService,
    private readonly billingFacade: BillingFacade,
    private readonly planPermissionService: PlanPermissionService,
    private readonly routineConflictChecker: RoutineConflictCheckerService,
    private readonly deviceGroupPolicy: DeviceGroupPolicyService,
    private readonly store: DeviceControlStore
  ) {}

  async loadDeviceControl(): Promise<void> {
    this.startRequest();

    try {
      await Promise.all([
        this.loadDevices(),
        this.loadRoutines(),
        this.loadDeviceGroups(),
        this.loadOperationModes(),
      ]);
    } catch (error) {
      console.error(error);
      this.store.setError('devices.loadError');
    } finally {
      this.finishRequest();
    }
  }

  async loadDevices(): Promise<void> {
    const responses = await firstValueFrom(this.devicesApi.findAllForCurrentUser());

    this.store.setDevices(
      responses.map((response) => this.deviceAssembler.toEntity(response))
    );
  }

  async createDevice(command: CreateDeviceCommand): Promise<Device | null> {
    this.startRequest();

    try {
      const activePlanCode = this.billingFacade.activePlanCode();

      const canCreate = this.planPermissionService.canCreateDevice(
        activePlanCode,
        this.store.devices().length
      );

      if (!canCreate) {
        this.store.setError('devices.planLimitReached');
        return null;
      }

      if (!command.name.trim()) {
        this.store.setError('devices.createError');
        return null;
      }

      const powerRules: Record<string, { min: number; max: number }> = {
        PLUG: { min: 5, max: 2500 },
        LIGHT: { min: 3, max: 150 },
        SWITCH: { min: 5, max: 1800 },
        SENSOR: { min: 1, max: 30 },
        OTHER: { min: 1, max: 1000 },
      };

      const rule = powerRules[command.type];
      const watts = Number(command.powerWatts);

      if (!rule || !Number.isFinite(watts) || watts < rule.min || watts > rule.max) {
        this.store.setError('devices.invalidPowerRange');
        return null;
      }

      const response = await firstValueFrom(
        this.devicesApi.create({
          name: command.name.trim(),
          room: command.room?.trim() ?? '',
          type: command.type,
          powerWatts: Number(command.powerWatts),
          status: 'OFF',
          createdAt: new Date().toISOString().slice(0, 10),
        })
      );

      const device = this.deviceAssembler.toEntity(response);
      this.store.prependDevice(device);

      return device;
    } catch (error) {
      console.error(error);
      this.store.setError('devices.createError');
      return null;
    } finally {
      this.finishRequest();
    }
  }

  async pairDevice(command: PairDeviceCommand): Promise<Device | null> {
    this.startRequest();

    try {
      const activePlanCode = this.billingFacade.activePlanCode();
      const canCreate = this.planPermissionService.canCreateDevice(
        activePlanCode,
        this.store.devices().length
      );

      if (!canCreate) {
        this.store.setError('devices.planLimitReached');
        return null;
      }

      const pairingCode = command.pairingCode.trim();

      if (!pairingCode) {
        this.store.setError('devices.pairError');
        return null;
      }

      const response = await firstValueFrom(
        this.devicesApi.pair({
          pairingCode,
          alias: command.alias?.trim() || null,
          room: command.room?.trim() ?? '',
        })
      );

      const device = this.deviceAssembler.toEntity(response);
      this.store.prependDevice(device);

      return device;
    } catch (error) {
      console.error(error);
      this.store.setError('devices.pairError');
      return null;
    } finally {
      this.finishRequest();
    }
  }

  async updateDeviceStatus(command: UpdateDeviceStatusCommand): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.devicesApi.updateStatus({
          deviceId: command.deviceId,
          status: command.status,
        })
      );

      const updatedDevice = this.deviceAssembler.toEntity(response);

      this.store.updateDevice(updatedDevice);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('devices.updateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async updateDevice(command: UpdateDeviceCommand): Promise<boolean> {
    this.startRequest();

    try {
      const name = command.name.trim();

      if (name.length < 3) {
        this.store.setError('devices.updateError');
        return false;
      }

      const response = await firstValueFrom(
        this.devicesApi.updateDetails({
          deviceId: command.deviceId,
          resource: {
            name,
            room: command.room?.trim() ?? '',
            type: command.type,
            powerWatts: Number(command.powerWatts),
          },
        })
      );

      const updatedDevice = this.deviceAssembler.toEntity(response);

      this.store.updateDevice(updatedDevice);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('devices.updateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async toggleDevice(device: Device): Promise<boolean> {
    const nextStatus: DeviceStatus = device.isOn ? 'OFF' : 'ON';

    return this.updateDeviceStatus({
      deviceId: device.id,
      status: nextStatus,
    });
  }

  async deleteDevice(deviceId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.devicesApi.delete(deviceId));
      this.store.removeDevice(deviceId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('devices.deleteError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async loadRoutines(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.routinesApi.findAllForCurrentUser()
      );

      const routines = response.map((item) => this.routineAssembler.toEntity(item));

      this.store.setRoutines(routines);
    } catch (error) {
      console.error(error);
      this.store.setError('routines.loadError');
    }
  }

  async createRoutine(command: CreateRoutineCommand): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.routinesApi.create({
          deviceId: command.deviceId ?? null,
          groupId: command.groupId ?? null,
          targetType: command.targetType,
          targetId: command.targetId,
          name: command.name.trim(),
          action: command.action,
          time: command.time,
          repeatType: command.repeatType ?? 'DAILY',
          daysOfWeek: command.daysOfWeek ?? '',
          intervalDays: command.intervalDays ?? 1,
          startsOn: command.startsOn ?? null,
          enabled: true,
        })
      );

      const routine = this.routineAssembler.toEntity(response);

      this.store.prependRoutine(routine);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('routines.createError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async updateRoutineStatus(command: UpdateRoutineStatusCommand): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.routinesApi.updateStatus({
          routineId: command.routineId,
          enabled: command.enabled,
        })
      );

      const routine = this.routineAssembler.toEntity(response);

      this.store.updateRoutine(routine);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('routines.updateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async deleteRoutine(routineId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.routinesApi.delete(routineId));

      this.store.removeRoutine(routineId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('routines.deleteError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async executeRoutine(routineId: number): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.routinesApi.execute(routineId)
      );

      const routine = this.routineAssembler.toEntity(response);

      this.store.updateRoutine(routine);
      await this.loadDevices();
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('routines.executeError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async loadDeviceGroups(): Promise<void> {
    const responses = await firstValueFrom(
      this.deviceGroupsApi.findAllForCurrentUser()
    );

    this.store.setDeviceGroups(
      responses.map((response) => this.deviceGroupAssembler.toEntity(response))
    );
  }

  async createDeviceGroup(command: CreateDeviceGroupCommand): Promise<boolean> {
    this.startRequest();

    try {
      if (!this.deviceGroupPolicy.canCreateGroup(command.name, command.deviceIds)) {
        this.store.setError('deviceGroups.createError');
        return false;
      }

      const response = await firstValueFrom(
        this.deviceGroupsApi.create({
          name: command.name.trim(),
          description: command.description?.trim() ?? '',
          deviceIds: command.deviceIds,
          createdAt: new Date().toISOString().slice(0, 10),
        })
      );

      const group = this.deviceGroupAssembler.toEntity(response);

      this.store.prependDeviceGroup(group);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('deviceGroups.createError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async updateDeviceGroup(command: UpdateDeviceGroupCommand): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.deviceGroupsApi.patch(command.groupId, {
          name: command.name.trim(),
          description: command.description.trim(),
          deviceIds: command.deviceIds,
        })
      );

      const updatedGroup = this.deviceGroupAssembler.toEntity(response);

      this.store.updateDeviceGroup(updatedGroup);

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('deviceGroups.updateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async deleteDeviceGroup(groupId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.deviceGroupsApi.delete(groupId));

      this.store.removeDeviceGroup(groupId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('deviceGroups.deleteError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async executeGroupAction(command: ExecuteGroupActionCommand): Promise<boolean> {
    this.startRequest();

    try {
      const group = this.store
        .deviceGroups()
        .find((item) => item.id === command.groupId);

      if (!group || !this.deviceGroupPolicy.canExecuteGroupAction(group)) {
        this.store.setError('deviceGroups.executeError');
        return false;
      }

      await firstValueFrom(
        this.deviceGroupsApi.executeAction({
          groupId: command.groupId,
          status: command.status,
        })
      );

      await this.loadDevices();

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('deviceGroups.executeError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async loadOperationModes(): Promise<void> {
    const responses = await firstValueFrom(
      this.operationModesApi.findAllForCurrentUser()
    );

    this.store.setOperationModes(
      responses.map((response) => this.operationModeAssembler.toEntity(response))
    );
  }

  async createOperationMode(command: CreateOperationModeCommand): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.operationModesApi.create({
          ...command,
          routineIds: command.routineIds ?? [],
          routinesToEnableIds: command.routinesToEnableIds ?? [],
          routinesToDisableIds: command.routinesToDisableIds ?? [],
          applyRoutines: command.applyRoutines ?? false,
        })
      );

      this.store.prependOperationMode(this.operationModeAssembler.toEntity(response));
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('operationModes.createError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async previewOperationMode(modeId: number): Promise<OperationModePreview | null> {
    try {
      const response = await firstValueFrom(
        this.operationModesApi.preview(modeId)
      );

      return this.operationModeAssembler.toPreview(response);
    } catch (error) {
      console.error(error);
      this.store.setError('operationModes.previewError');
      return null;
    }
  }

  async activateOperationMode(modeId: number): Promise<OperationModeActivation | null> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.operationModesApi.activate(modeId)
      );
      const result = this.operationModeAssembler.toActivation(response);

      this.store.updateOperationMode(result.mode);
      await Promise.all([this.loadDevices(), this.loadRoutines(), this.loadOperationModes()]);
      return result;
    } catch (error) {
      console.error(error);
      this.store.setError('operationModes.activateError');
      return null;
    } finally {
      this.finishRequest();
    }
  }

  async archiveOperationMode(modeId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.operationModesApi.archive(modeId));

      this.store.removeOperationMode(modeId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('operationModes.archiveError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  getDeviceName(deviceId: number): string {
    return (
      this.store.devices().find((device) => device.id === deviceId)?.name ??
      `Device #${deviceId}`
    );
  }

  clearMessages(): void {
    this.store.clearMessages();
  }

  private startRequest(): void {
    this.store.setLoading(true);
    this.store.clearMessages();
  }

  private finishRequest(): void {
    this.store.setLoading(false);
  }
}
