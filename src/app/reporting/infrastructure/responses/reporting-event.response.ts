export interface ReportingEventResponse {
  id: number;
  eventName: string;
  sourceContext: string;
  subjectType: string;
  subjectId: string | null;
  summary: string;
  detail: string | null;
  occurredOn: string;
}
