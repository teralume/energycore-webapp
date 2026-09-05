export const ROUTE_PATHS = {
  IAM: {
    LOGIN: '/iam/login',
    REGISTER: '/iam/register',
    RECOVER_PASSWORD: '/iam/recover-password',
    RESET_PASSWORD: '/iam/reset-password',
    PROFILE: '/settings/profile',
    ACCOUNT: '/settings/account',
    SECURITY: '/settings/security',
    ACCESS: '/settings/access',
    PLATFORM: '/settings/platform',
  },

  HOME: '/home',
  ABOUT: '/about',

  BILLING: {
    SETTINGS: '/settings/billing',
    PLANS: '/plans',
    HISTORY: '/settings/billing',
  },

  DEVICE_CONTROL: {
    DEVICES: '/operation/devices',
    ROUTINES: '/operation/routines',
    DEVICE_GROUPS: '/operation/groups',
    OPERATION_MODES: '/operation/modes',
  },

  ENERGY_MONITORING: {
    DASHBOARD: '/energy/consumption',
    HISTORY: '/energy/history',
  },

  NOTIFICATIONS: {
    ALERTS: '/alerts/inbox',
    ALERT_RULES: '/alerts/rules',
    PREFERENCES: '/alerts/preferences',
  },

  WORKPLACE: {
    OVERVIEW: '/spaces/sites',
    LOCATIONS: '/spaces/sites',
    ROOMS: '/spaces/rooms',
    DEVICE_ASSIGNMENTS: '/spaces/assignments',
  },

  REPORTING: {
    REPORTS: '/energy/reports',
    ENERGY_GOALS: '/energy/goals',
  },

  SERVICE_MANAGEMENT: {
    SUPPORT_TICKETS: '/service/support',
    MAINTENANCE_TICKETS: '/service/maintenance',
  },

  LEGACY: {
    IAM_PROFILE: '/iam/profile',
    BILLING_PLANS: '/plans',
    BILLING_HISTORY: '/billing/history',
    ENERGY_DASHBOARD: '/energy',
    WORKPLACE: '/workplace',
    WORKPLACE_LOCATIONS: '/workplace/locations',
    WORKPLACE_ROOMS: '/workplace/rooms',
    WORKPLACE_DEVICE_ASSIGNMENTS: '/workplace/device-assignments',
    DEVICES: '/devices',
    DEVICE_GROUPS: '/device-groups',
    ROUTINES: '/routines',
    OPERATION_MODES: '/operation-modes',
    ALERTS: '/alerts',
    NOTIFICATION_PREFERENCES: '/notifications/preferences',
    SUPPORT_TICKETS: '/support-tickets',
    MAINTENANCE_TICKETS: '/maintenance-tickets',
    REPORTS: '/reports',
    ENERGY_GOALS: '/reports/energy-goals',
  },
} as const;
