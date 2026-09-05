import { Injectable } from '@angular/core';

import { PlanCode } from '../model/plan.entity';
import { Subscription } from '../model/subscription.entity';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionPolicyService {
  canSubscribeToPlan(
    currentSubscription: Subscription | null,
    targetPlanCode: PlanCode
  ): boolean {
    if (!currentSubscription) return true;
    if (!currentSubscription.isActive) return true;

    return currentSubscription.planCode !== targetPlanCode;
  }

  canCancelSubscription(subscription: Subscription | null): boolean {
    return subscription !== null && subscription.isActive;
  }
}