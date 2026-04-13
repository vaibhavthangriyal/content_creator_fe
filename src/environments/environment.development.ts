const metaEnv = (import.meta as any)?.env ?? {};

export const environment = {
  production: false,
  apiBaseUrl: metaEnv['NG_APP_API_BASE_URL'] ?? 'http://localhost:4000/api',
};
