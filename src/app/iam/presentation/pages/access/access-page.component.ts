import { Component, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AccessPermission } from '../../../domain/model/access-permission.model';
import { AccessProfile } from '../../../domain/model/access-profile.entity';
import { User } from '../../../domain/model/user.entity';
import { IamFacade } from '../../../application/services/iam.facade';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { SettingsSectionComponent } from '../../../../shared/presentation/components/settings-section/settings-section.component';

@Component({
  selector: 'app-access-page',
  standalone: true,
  imports: [TranslateModule, SettingsSectionComponent, AppDropdownComponent],
  templateUrl: './access-page.component.html',
  styleUrls: ['../settings-page.shared.scss'],
})
export class AccessPageComponent implements OnInit {
  constructor(
    readonly iamFacade: IamFacade,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.iamFacade.loadAccessProfiles();
    await this.iamFacade.loadManagedUsers();
  }

  isCurrentProfile(profile: AccessProfile): boolean {
    return this.iamFacade.currentUser()?.accessProfileName === profile.name;
  }

  profileLabelKey(profile: AccessProfile): string {
    return `settings.access.profiles.${profile.name.toLowerCase()}.title`;
  }

  profileDescriptionKey(profile: AccessProfile): string {
    return `settings.access.profiles.${profile.name.toLowerCase()}.description`;
  }

  permissionLabelKey(permission: AccessPermission): string {
    return `settings.access.permissions.${permission}`;
  }

  permissionCount(profile: AccessProfile): string {
    return this.translate.instant('settings.access.permissionCount', {
      count: profile.permissions.length,
    });
  }

  profileOptions(): DropdownOption[] {
    return this.iamFacade.accessProfiles().map((profile) => ({
      label: profile.name,
      labelKey: this.profileLabelKey(profile),
      descriptionKey: this.profileDescriptionKey(profile),
      value: String(profile.id),
    }));
  }

  profileValue(user: User): string {
    return String(user.accessProfileId);
  }

  userStatusLabelKey(user: User): string {
    return `settings.access.statuses.${user.status.toLowerCase()}`;
  }

  async onProfileSelected(user: User, profileId: string): Promise<void> {
    const accessProfileId = Number(profileId);

    if (!Number.isFinite(accessProfileId) || accessProfileId === user.accessProfileId) {
      return;
    }

    await this.iamFacade.assignAccessProfile(user.id, accessProfileId);
  }
}
