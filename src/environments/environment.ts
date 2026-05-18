const metaEnv = (import.meta as any)?.env ?? {};

export const environment = {
  production: true,
  apiBaseUrl: metaEnv['NG_APP_API_BASE_URL'] || 'https://content-creator-be.onrender.com/api' || 'http://localhost:4000/api',
  illustratorTemplateId: metaEnv['NG_APP_ILLUSTRATOR_TEMPLATE_ID'] ?? 'vt_fact_post_1',
};
