import { Injectable } from '@angular/core';
import { PlanCode } from '../model/plan.entity';

export interface PlanPermissions {
  maxDevices: number;
  maxRoutines: number;
  maxManualAlerts: number;
  canExportCsv: boolean;
  canAccessEnergyHistory: boolean;
  canUseAdvancedAnalytics: boolean;
  canUseMultipleLocations: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PlanPermissionService {
  private readonly permissions: Record<PlanCode, PlanPermissions> = {
    STARTER: {
      maxDevices: 5,
      maxRoutines: 3,
      maxManualAlerts: 5,
      canExportCsv: false,
      canAccessEnergyHistory: false,
      canUseAdvancedAnalytics: false,
      canUseMultipleLocations: false,
    },
    PROFESSIONAL: {
      maxDevices: 20,
      maxRoutines: 15,
      maxManualAlerts: 30,
      canExportCsv: true,
      canAccessEnergyHistory: true,
      canUseAdvancedAnalytics: true,
      canUseMultipleLocations: false,
    },
    ENTERPRISE: {
      maxDevices: 100,
      maxRoutines: 100,
      maxManualAlerts: 9999,
      canExportCsv: true,
      canAccessEnergyHistory: true,
      canUseAdvancedAnalytics: true,
      canUseMultipleLocations: true,
    },
  };

  getPermissions(planCode: PlanCode | null): PlanPermissions | null {
    if (!planCode) return null;
    return this.permissions[planCode];
  }

  canCreateDevice(planCode: PlanCode | null, currentDevices: number): boolean {
    const permissions = this.getPermissions(planCode);
    if (!permissions) return false;
    return currentDevices < permissions.maxDevices;
  }

  canCreateRoutine(planCode: PlanCode | null, currentRoutines: number): boolean {
    const permissions = this.getPermissions(planCode);
    if (!permissions) return false;
    return currentRoutines < permissions.maxRoutines;
  }

  canCreateManualAlert(planCode: PlanCode | null, currentAlerts: number): boolean {
    const permissions = this.getPermissions(planCode);
    if (!permissions) return false;
    return currentAlerts < permissions.maxManualAlerts;
  }

  canExportCsv(planCode: PlanCode | null): boolean {
    return this.getPermissions(planCode)?.canExportCsv ?? false;
  }

  canAccessEnergyHistory(planCode: PlanCode | null): boolean {
    return this.getPermissions(planCode)?.canAccessEnergyHistory ?? false;
  }

  canUseAdvancedAnalytics(planCode: PlanCode | null): boolean {
    return this.getPermissions(planCode)?.canUseAdvancedAnalytics ?? false;
  }

  canUseMultipleLocations(planCode: PlanCode | null): boolean {
    return this.getPermissions(planCode)?.canUseMultipleLocations ?? false;
  }
}