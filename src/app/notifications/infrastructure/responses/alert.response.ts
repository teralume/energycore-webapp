import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import {
  AlertEventType,
  AlertLevel,
  AlertSourceType,
} from '../../domain/model/alert.entity';

export interface AlertResponse extends BaseResponse<number> {
  userId: number;
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
  repeatCount?: number;
  active?: boolean;
  resolved?: boolean;
  read?: boolean;
  readStatus?: boolean;
  createdAt?: string;
  firstDetectedAt?: string | null;
  lastTriggeredAt?: string | null;
  dismissedUntil?: string | null;
  expiresAt?: string | null;
  expired?: boolean;
  silenced?: boolean;
}
