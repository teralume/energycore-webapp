import {
  OperationMode,
  OperationModeActivation,
  OperationModePreview,
} from '../../domain/model/operation-mode.entity';
import {
  OperationModeActivationResponse,
  OperationModePreviewResponse,
  OperationModeResponse,
} from '../responses/operation-mode.response';

export class OperationModeAssembler {
  toEntity(response: OperationModeResponse): OperationMode {
    return new OperationMode({
      id: response.id,
      userId: response.userId,
      locationId: response.locationId,
      name: response.name,
      description: response.description,
      status: response.status,
      roomIds: response.roomIds ?? [],
      groupIds: response.groupIds ?? [],
      deviceIds: response.deviceIds ?? [],
      turnOnDeviceIds: response.turnOnDeviceIds ?? [],
      turnOffDeviceIds: response.turnOffDeviceIds ?? [],
      keepOnDeviceIds: response.keepOnDeviceIds ?? [],
      routineIds: response.routineIds ?? [],
      routinesToEnableIds: response.routinesToEnableIds ?? [],
      routinesToDisableIds: response.routinesToDisableIds ?? [],
      goalIds: response.goalIds ?? [],
      internalRoutines: response.internalRoutines ?? [],
      allDay: response.allDay ?? true,
      startsAt: response.startsAt ?? '00:00',
      endsAt: response.endsAt ?? '23:59',
      ruleProfileId: response.ruleProfileId ?? null,
      preferenceId: response.preferenceId ?? null,
      applyRuleProfile: response.applyRuleProfile ?? true,
      applyNotificationPreference: response.applyNotificationPreference ?? true,
      applyRoutines: response.applyRoutines ?? true,
      preserveCriticalSound: response.preserveCriticalSound ?? true,
      lastActivatedAt: response.lastActivatedAt ?? null,
    });
  }

  toPreview(response: OperationModePreviewResponse): OperationModePreview {
    return response;
  }

  toActivation(response: OperationModeActivationResponse): OperationModeActivation {
    return {
      ...response,
      mode: this.toEntity(response.mode),
    };
  }
}
