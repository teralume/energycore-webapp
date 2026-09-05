import {
  AlertEventType,
  AlertLevel,
  AlertSourceType,
} from '../../domain/model/alert.entity';

export interface CreateAlertCommand {
  title: string;
  message: string;
  level: AlertLevel;
  sourceType?: AlertSourceType;
  sourceId?: string | null;
  sourceLabel?: string | null;
  eventType?: AlertEventType;
  threadKey?: string;
  evidence?: string | null;
  explanation?: string | null;
  recommendedAction?: string | null;
  severityScore?: number;
  expiresAt?: string | null;
}
