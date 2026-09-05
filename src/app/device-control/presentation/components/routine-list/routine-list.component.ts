import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { DeviceGroup } from '../../../domain/model/device-group.entity';
import { Device } from '../../../domain/model/device.entity';
import { Routine, RoutineAction, RoutineTargetType } from '../../../domain/model/routine.entity';

@Component({
  selector: 'app-routine-list',
  standalone: true,
  imports: [TranslateModule, AppButtonComponent],
  templateUrl: './routine-list.component.html',
  styleUrls: ['./routine-list.component.scss'],
})
export class RoutineListComponent {
  @Input({ required: true }) routines: Routine[] = [];
  @Input() devices: Device[] = [];
  @Input() deviceGroups: DeviceGroup[] = [];

  @Output() toggle = new EventEmitter<Routine>();
  @Output() remove = new EventEmitter<number>();

  constructor(private readonly translate: TranslateService) {}

  getTargetName(routine: Routine): string {
    if (routine.targetName) {
      return routine.targetName;
    }

    if (routine.targetType === 'GROUP') {
      const group = this.deviceGroups.find((item) => item.id === routine.groupId);

      return group?.name ?? this.t('routines.list.groupFallback', {
        id: routine.groupId ?? routine.targetId,
      });
    }

    const device = this.devices.find((item) => item.id === routine.deviceId);

    return device?.name ?? this.t('routines.list.deviceFallback', {
      id: routine.deviceId ?? routine.targetId,
    });
  }

  getTargetTypeLabelKey(routine: Routine): string {
    return this.getTargetTypeKey(routine.targetType);
  }

  getStatusLabelKey(routine: Routine): string {
    return routine.enabled ? 'routines.status.active' : 'routines.status.inactive';
  }

  getActionLabelKey(routine: Routine): string {
    return this.getActionKey(routine.action);
  }

  getToggleLabelKey(routine: Routine): string {
    return routine.enabled ? 'routines.disable' : 'routines.enable';
  }

  getTargetTypeLabel(routine: Routine): string {
    return this.t(this.getTargetTypeKey(routine.targetType));
  }

  getActionLabel(routine: Routine): string {
    return this.t(this.getActionKey(routine.action));
  }

  private getTargetTypeKey(targetType: RoutineTargetType): string {
    const labels: Record<RoutineTargetType, string> = {
      DEVICE: 'routines.targetTypes.device',
      GROUP: 'routines.targetTypes.group',
      ROOM: 'routines.targetTypes.room',
      WORKPLACE: 'routines.targetTypes.workplace',
    };

    return labels[targetType] ?? 'routines.targetTypes.device';
  }

  getTargetIcon(routine: Routine): string {
    const icons: Record<RoutineTargetType, string> = {
      DEVICE: 'D',
      GROUP: 'G',
      ROOM: 'H',
      WORKPLACE: 'S',
    };

    return icons[routine.targetType] ?? 'D';
  }

  private getActionKey(action: RoutineAction): string {
    return action === 'TURN_ON'
      ? 'routines.actions.turnOn'
      : 'routines.actions.turnOff';
  }

  onToggle(routine: Routine): void {
    this.toggle.emit(routine);
  }

  onRemove(routineId: number): void {
    this.remove.emit(routineId);
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
