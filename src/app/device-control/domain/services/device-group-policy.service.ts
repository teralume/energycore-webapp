import { Injectable } from '@angular/core';

import { DeviceGroup } from '../model/device-group.entity';

@Injectable({
  providedIn: 'root',
})
export class DeviceGroupPolicyService {
  canCreateGroup(
    name: string,
    deviceIds: number[] | null | undefined
  ): boolean {
    return Boolean(name?.trim()) && Array.isArray(deviceIds) && deviceIds.length > 0;
  }

  canExecuteGroupAction(group: DeviceGroup | null | undefined): boolean {
    return Boolean(group?.hasDevices);
  }
}