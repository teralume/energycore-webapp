import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { DeviceControlFacade } from '../../../device-control/application/services/device-control.facade';

import { AssignDeviceCommand } from '../commands/assign-device.command';
import { CreateLocationCommand } from '../commands/create-location.command';
import { CreateRoomCommand } from '../commands/create-room.command';
import { MoveDeviceAssignmentCommand } from '../commands/move-device-assignment.command';
import { UpdateLocationCommand } from '../commands/update-location.command';
import { UpdateRoomCommand } from '../commands/update-room.command';

import { DeviceAssignmentsApiService } from '../../infrastructure/api/device-assignments-api.service';
import { LocationsApiService } from '../../infrastructure/api/locations-api.service';
import { RoomsApiService } from '../../infrastructure/api/rooms-api.service';

import { DeviceAssignmentAssembler } from '../../infrastructure/assemblers/device-assignment.assembler';
import { LocationAssembler } from '../../infrastructure/assemblers/location.assembler';
import { RoomAssembler } from '../../infrastructure/assemblers/room.assembler';

import { DeviceAssignment } from '../../domain/model/device-assignment.entity';
import { WorkplaceStore } from '../stores/workplace.store';

@Injectable({
  providedIn: 'root',
})
export class WorkplaceFacade {
  private readonly locationAssembler = new LocationAssembler();
  private readonly roomAssembler = new RoomAssembler();
  private readonly deviceAssignmentAssembler = new DeviceAssignmentAssembler();

  get locations() {
    return this.store.locations;
  }

  get rooms() {
    return this.store.rooms;
  }

  get deviceAssignments() {
    return this.store.deviceAssignments;
  }

  get currentDeviceAssignments(): DeviceAssignment[] {
    const visibleDeviceIds = new Set(
      this.deviceControlFacade
        .devices()
        .filter((device) => !device.isRemoved)
        .map((device) => device.id)
    );

    return [...this.currentAssignmentsByDevice().values()]
      .filter((assignment) => visibleDeviceIds.has(assignment.deviceId))
      .sort((first, second) =>
        this.assignmentTimestamp(second) - this.assignmentTimestamp(first) ||
        second.id - first.id
      );
  }

  get loading() {
    return this.store.loading;
  }

  get error() {
    return this.store.error;
  }

  get businessLocations() {
    return this.store.businessLocations;
  }

  get branchLocations() {
    return this.store.branchLocations;
  }

  get homeLocations() {
    return this.store.homeLocations;
  }

  constructor(
    private readonly locationsApi: LocationsApiService,
    private readonly roomsApi: RoomsApiService,
    private readonly deviceAssignmentsApi: DeviceAssignmentsApiService,
    private readonly deviceControlFacade: DeviceControlFacade,
    private readonly store: WorkplaceStore
  ) {}

  async loadWorkplace(): Promise<void> {
    this.startRequest();

    try {
      await Promise.all([
        this.loadLocations(),
        this.loadRooms(),
        this.loadDeviceAssignments(),
        this.deviceControlFacade.loadDeviceControl(),
      ]);
    } catch (error) {
      console.error(error);
      this.store.setError('workplace.loadError');
    } finally {
      this.finishRequest();
    }
  }

  async loadLocations(): Promise<void> {
    const responses = await firstValueFrom(
      this.locationsApi.findAllForCurrentUser()
    );

    const locations = responses
      .map((response) => this.locationAssembler.toEntity(response))
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      );

    this.store.setLocations(locations);
  }

  async createLocation(command: CreateLocationCommand): Promise<boolean> {
    this.startRequest();

    try {
      if (!command.name.trim() || !command.address.trim()) {
        this.store.setError('workplace.locationCreateError');
        return false;
      }

      const response = await firstValueFrom(
        this.locationsApi.create({
          name: command.name.trim(),
          address: command.address.trim(),
          type: command.type,
          createdAt: new Date().toISOString().slice(0, 10),
        })
      );

      this.store.prependLocation(this.locationAssembler.toEntity(response));
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('workplace.locationCreateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async updateLocation(command: UpdateLocationCommand): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.locationsApi.patch(command.locationId, {
          name: command.name.trim(),
          address: command.address.trim(),
          type: command.type,
        })
      );

      this.store.updateLocation(this.locationAssembler.toEntity(response));
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('workplace.locationUpdateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async deleteLocation(locationId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.locationsApi.delete(locationId));
      this.store.removeLocation(locationId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('workplace.locationDeleteError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async loadRooms(): Promise<void> {
    const responses = await firstValueFrom(
      this.roomsApi.findAllForCurrentUser()
    );

    const rooms = responses
      .map((response) => this.roomAssembler.toEntity(response))
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      );

    this.store.setRooms(rooms);
  }

  async createRoom(command: CreateRoomCommand): Promise<boolean> {
    this.startRequest();

    try {
      if (!command.name.trim() || !command.floor.trim()) {
        this.store.setError('workplace.roomCreateError');
        return false;
      }

      const response = await firstValueFrom(
        this.roomsApi.create({
          locationId: Number(command.locationId),
          name: command.name.trim(),
          floor: command.floor.trim(),
          createdAt: new Date().toISOString().slice(0, 10),
        })
      );

      this.store.prependRoom(this.roomAssembler.toEntity(response));
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('workplace.roomCreateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async updateRoom(command: UpdateRoomCommand): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.roomsApi.patch(command.roomId, {
          locationId: Number(command.locationId),
          name: command.name.trim(),
          floor: command.floor.trim(),
        })
      );

      this.store.updateRoom(this.roomAssembler.toEntity(response));
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('workplace.roomUpdateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async deleteRoom(roomId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.roomsApi.delete(roomId));
      await Promise.all([this.loadRooms(), this.loadDeviceAssignments()]);

      const roomStillExists = this.store.rooms().some((room) => room.id === roomId);

      if (roomStillExists) {
        this.store.setError('workplace.roomDeleteError');
        return false;
      }

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('workplace.roomDeleteError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async loadDeviceAssignments(): Promise<void> {
    const responses = await firstValueFrom(
      this.deviceAssignmentsApi.findAllForCurrentUser()
    );

    const assignments = responses
      .map((response) => this.deviceAssignmentAssembler.toEntity(response))
      .sort(
        (first, second) =>
          new Date(second.assignedAt).getTime() -
          new Date(first.assignedAt).getTime()
      );

    this.store.setDeviceAssignments(assignments);
  }

  async assignDevice(command: AssignDeviceCommand): Promise<boolean> {
    this.startRequest();

    try {
      const alreadyAssigned = this.store
        .deviceAssignments()
        .some((assignment) => assignment.deviceId === Number(command.deviceId));

      if (alreadyAssigned) {
        this.store.setError('workplace.deviceAlreadyAssigned');
        return false;
      }

      const response = await firstValueFrom(
        this.deviceAssignmentsApi.create({
          deviceId: Number(command.deviceId),
          locationId: Number(command.locationId),
          roomId: command.roomId ? Number(command.roomId) : null,
          assignedAt: new Date().toISOString().slice(0, 10),
        })
      );

      this.store.prependDeviceAssignment(
        this.deviceAssignmentAssembler.toEntity(response)
      );

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('workplace.assignmentCreateError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async moveDeviceAssignment(command: MoveDeviceAssignmentCommand): Promise<boolean> {
    this.startRequest();

    try {
      const response = await firstValueFrom(
        this.deviceAssignmentsApi.patch(command.assignmentId, {
          locationId: Number(command.locationId),
          roomId: command.roomId ? Number(command.roomId) : null,
        })
      );

      this.store.updateDeviceAssignment(
        this.deviceAssignmentAssembler.toEntity(response)
      );

      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('workplace.assignmentMoveError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  async deleteDeviceAssignment(assignmentId: number): Promise<boolean> {
    this.startRequest();

    try {
      await firstValueFrom(this.deviceAssignmentsApi.delete(assignmentId));
      this.store.removeDeviceAssignment(assignmentId);
      return true;
    } catch (error) {
      console.error(error);
      this.store.setError('workplace.assignmentDeleteError');
      return false;
    } finally {
      this.finishRequest();
    }
  }

  getLocationName(locationId: number): string {
    return (
      this.store.locations().find((location) => location.id === locationId)
        ?.name ?? `Location #${locationId}`
    );
  }

  getRoomName(roomId: number | null): string {
    if (roomId === null) {
      return 'Sin habitacion';
    }

    return (
      this.store.rooms().find((room) => room.id === roomId)?.name ??
      `Room #${roomId}`
    );
  }

  getDeviceName(deviceId: number): string {
    return this.deviceControlFacade.getDeviceName(deviceId);
  }

  getRoomsByLocation(locationId: number): ReturnType<WorkplaceStore['rooms']> {
    return this.store.rooms().filter((room) => room.locationId === locationId);
  }

  getCurrentDeviceAssignmentsForLocation(locationId: number): DeviceAssignment[] {
    return this.currentDeviceAssignments.filter(
      (assignment) => assignment.locationId === locationId
    );
  }

  clearMessages(): void {
    this.store.clearMessages();
  }

  private currentAssignmentsByDevice(): Map<number, DeviceAssignment> {
    const currentAssignments = new Map<number, DeviceAssignment>();

    for (const assignment of this.store.deviceAssignments()) {
      const current = currentAssignments.get(assignment.deviceId);

      if (!current || this.isNewerAssignment(assignment, current)) {
        currentAssignments.set(assignment.deviceId, assignment);
      }
    }

    return currentAssignments;
  }

  private isNewerAssignment(candidate: DeviceAssignment, current: DeviceAssignment): boolean {
    const candidateTime = this.assignmentTimestamp(candidate);
    const currentTime = this.assignmentTimestamp(current);

    return candidateTime > currentTime ||
      (candidateTime === currentTime && candidate.id > current.id);
  }

  private assignmentTimestamp(assignment: DeviceAssignment): number {
    const assignedAt = Date.parse(assignment.assignedAt);
    return Number.isNaN(assignedAt) ? 0 : assignedAt;
  }

  private startRequest(): void {
    this.store.setLoading(true);
    this.store.clearMessages();
  }

  private finishRequest(): void {
    this.store.setLoading(false);
  }
}
