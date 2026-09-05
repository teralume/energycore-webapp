import { Injectable, computed, signal } from '@angular/core';

import { DeviceAssignment } from '../../domain/model/device-assignment.entity';
import { Location } from '../../domain/model/location.entity';
import { Room } from '../../domain/model/room.entity';

@Injectable({
  providedIn: 'root',
})
export class WorkplaceStore {
  private readonly locationsSignal = signal<Location[]>([]);
  private readonly roomsSignal = signal<Room[]>([]);
  private readonly deviceAssignmentsSignal = signal<DeviceAssignment[]>([]);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly locations = computed(() => this.locationsSignal());
  readonly rooms = computed(() => this.roomsSignal());
  readonly deviceAssignments = computed(() => this.deviceAssignmentsSignal());

  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly businessLocations = computed(() =>
    this.locationsSignal().filter((location) => location.isBusiness)
  );

  readonly branchLocations = computed(() =>
    this.locationsSignal().filter((location) => location.isBranch)
  );

  readonly homeLocations = computed(() =>
    this.locationsSignal().filter((location) => location.isHome)
  );

  setLocations(value: Location[]): void {
    this.locationsSignal.set(value);
  }

  prependLocation(value: Location): void {
    this.locationsSignal.update((locations) => [value, ...locations]);
  }

  updateLocation(value: Location): void {
    this.locationsSignal.update((locations) =>
      locations.map((location) => (location.id === value.id ? value : location))
    );
  }

  removeLocation(locationId: number): void {
    this.locationsSignal.update((locations) =>
      locations.filter((location) => location.id !== locationId)
    );

    this.roomsSignal.update((rooms) =>
      rooms.filter((room) => room.locationId !== locationId)
    );

    this.deviceAssignmentsSignal.update((assignments) =>
      assignments.filter((assignment) => assignment.locationId !== locationId)
    );
  }

  setRooms(value: Room[]): void {
    this.roomsSignal.set(value);
  }

  prependRoom(value: Room): void {
    this.roomsSignal.update((rooms) => [value, ...rooms]);
  }

  updateRoom(value: Room): void {
    this.roomsSignal.update((rooms) =>
      rooms.map((room) => (room.id === value.id ? value : room))
    );
  }

  removeRoom(roomId: number): void {
    this.roomsSignal.update((rooms) => rooms.filter((room) => room.id !== roomId));

    this.deviceAssignmentsSignal.update((assignments) =>
      assignments.map((assignment) =>
        assignment.roomId === roomId
          ? new DeviceAssignment({
              id: assignment.id,
              userId: assignment.userId,
              deviceId: assignment.deviceId,
              locationId: assignment.locationId,
              roomId: null,
              assignedAt: assignment.assignedAt,
            })
          : assignment
      )
    );
  }

  setDeviceAssignments(value: DeviceAssignment[]): void {
    this.deviceAssignmentsSignal.set(value);
  }

  prependDeviceAssignment(value: DeviceAssignment): void {
    this.deviceAssignmentsSignal.update((assignments) => [value, ...assignments]);
  }

  updateDeviceAssignment(value: DeviceAssignment): void {
    this.deviceAssignmentsSignal.update((assignments) =>
      assignments.map((assignment) =>
        assignment.id === value.id ? value : assignment
      )
    );
  }

  removeDeviceAssignment(assignmentId: number): void {
    this.deviceAssignmentsSignal.update((assignments) =>
      assignments.filter((assignment) => assignment.id !== assignmentId)
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
    this.locationsSignal.set([]);
    this.roomsSignal.set([]);
    this.deviceAssignmentsSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
