import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { Plan, PlanCode } from '../../../domain/model/plan.entity';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [TranslateModule, DecimalPipe, AppButtonComponent],
  templateUrl: './plan-card.component.html',
  styleUrls: ['./plan-card.component.scss'],
})
export class PlanCardComponent {
  @Input({ required: true }) plan!: Plan;
  @Input() activePlanCode: PlanCode | null = null;

  @Output() selected = new EventEmitter<Plan>();

  private readonly featureKeysByPlan: Record<PlanCode, string[]> = {
    STARTER: ['devices', 'dashboard', 'alerts'],
    PROFESSIONAL: ['devices', 'analytics', 'routines', 'reports'],
    ENTERPRISE: ['locations', 'accessProfiles', 'alerts', 'support'],
  };

  get isSelected(): boolean {
    return this.activePlanCode === this.plan.code;
  }

  get isRecommended(): boolean {
    return this.plan.code === 'PROFESSIONAL';
  }

  get descriptionKey(): string {
    return `billing.planDescriptions.${this.plan.code}`;
  }

  get featureKeys(): string[] {
    return this.featureKeysByPlan[this.plan.code].map(
      (feature) => `billing.planFeatures.${this.plan.code}.${feature}`
    );
  }

  get usageKey(): string {
    return `billing.planUsage.${this.plan.code}`;
  }

  onSelect(): void {
    if (!this.isSelected) {
      this.selected.emit(this.plan);
    }
  }
}
