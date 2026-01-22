export const ROUTES = {
  TABS: {
    ROOT: '/(tabs)',
    SETTINGS: '/(tabs)/settings',
    MAP: '/(tabs)/map',
    ALERTS: '/(tabs)/alerts',
  },
  AUTH: {
    LOGIN: '/(auth)/login',
    SIGNUP: '/(auth)/signup',
    FORGOT_PASSWORD: '/(auth)/forgot-password',
  },
  SENSOR: {
    DETAIL: (id: string) => `/sensor/${id}`,
  },
  LEARN: {
    DETAIL: (id: string) => `/learn/${id}`,
  }
} as const;
