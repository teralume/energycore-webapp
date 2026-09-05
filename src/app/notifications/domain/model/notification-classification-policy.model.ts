import { AlertLevel } from './alert.entity';

export interface NotificationClassificationPolicy {
  stableMax: number;
  neutralMax: number;
  warningMax: number;
}

export interface NotificationSeverityBand {
  level: AlertLevel;
  label: string;
  from: number;
  to: number;
  tone: 'stable' | 'info' | 'warning' | 'critical';
  description: string;
}

export const DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY: NotificationClassificationPolicy = {
  stableMax: 25,
  neutralMax: 55,
  warningMax: 80,
};

export function normalizeNotificationClassificationPolicy(
  policy: Partial<NotificationClassificationPolicy> | null | undefined
): NotificationClassificationPolicy {
  const stableMax = clampNumber(policy?.stableMax, 5, 92, DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY.stableMax);
  const neutralMax = clampNumber(
    policy?.neutralMax,
    stableMax + 5,
    96,
    DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY.neutralMax
  );
  const warningMax = clampNumber(
    policy?.warningMax,
    neutralMax + 5,
    99,
    DEFAULT_NOTIFICATION_CLASSIFICATION_POLICY.warningMax
  );

  return {
    stableMax,
    neutralMax,
    warningMax,
  };
}

export function buildNotificationSeverityBands(
  policy: NotificationClassificationPolicy
): NotificationSeverityBand[] {
  const normalized = normalizeNotificationClassificationPolicy(policy);

  return [
    {
      level: 'STABLE',
      label: 'Estable',
      from: 0,
      to: normalized.stableMax,
      tone: 'stable',
      description: 'Operacion dentro del rango esperado.',
    },
    {
      level: 'INFO',
      label: 'Neutral',
      from: normalized.stableMax,
      to: normalized.neutralMax,
      tone: 'info',
      description: 'Evento util para seguimiento, sin urgencia.',
    },
    {
      level: 'WARNING',
      label: 'Atencion',
      from: normalized.neutralMax,
      to: normalized.warningMax,
      tone: 'warning',
      description: 'Conviene revisar antes de que escale.',
    },
    {
      level: 'CRITICAL',
      label: 'Critica',
      from: normalized.warningMax,
      to: 100,
      tone: 'critical',
      description: 'Requiere accion inmediata.',
    },
  ];
}

export function levelForNotificationScore(
  score: number,
  policy: NotificationClassificationPolicy
): AlertLevel {
  const normalized = normalizeNotificationClassificationPolicy(policy);
  const boundedScore = clampNumber(score, 0, 100, 0);

  if (boundedScore <= normalized.stableMax) {
    return 'STABLE';
  }

  if (boundedScore <= normalized.neutralMax) {
    return 'INFO';
  }

  if (boundedScore <= normalized.warningMax) {
    return 'WARNING';
  }

  return 'CRITICAL';
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  const numericValue = Number.isFinite(parsed) ? parsed : fallback;

  return Math.min(max, Math.max(min, Math.round(numericValue)));
}
