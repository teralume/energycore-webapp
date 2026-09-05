import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { AlertRule } from '../../domain/model/alert-rule.entity';
import { AlertRuleAssembler } from '../assemblers/alert-rule.assembler';
import { AlertRuleResource } from '../resources/alert-rule.resource';
import { EvaluateAlertRulesResource } from '../resources/evaluate-alert-rules.resource';
import { AlertRuleResponse } from '../responses/alert-rule.response';
import { RuleEvaluationResultResponse } from '../responses/rule-evaluation-result.response';

@Injectable({
  providedIn: 'root',
})
export class AlertRulesApiService extends BaseApiService<
  AlertRule,
  AlertRuleResource,
  AlertRuleResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'alerts/rules', new AlertRuleAssembler());
  }

  findAllForCurrentUser(): Observable<AlertRuleResponse[]> {
    return this.http.get<AlertRuleResponse[]>(this.resourceEndpoint);
  }

  toggle(ruleId: number): Observable<AlertRuleResponse> {
    return this.http.patch<AlertRuleResponse>(
      `${this.resourceEndpoint}/${ruleId}/toggle`,
      {}
    );
  }

  evaluate(resource: EvaluateAlertRulesResource): Observable<RuleEvaluationResultResponse> {
    return this.http.post<RuleEvaluationResultResponse>(
      `${this.resourceEndpoint}/evaluate`,
      resource
    );
  }
}
