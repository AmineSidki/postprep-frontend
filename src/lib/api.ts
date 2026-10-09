import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Do not try to refresh the session when this request fails with 401/403. */
    skipAuthRefresh?: boolean;
    _retried?: boolean;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true, // auth lives in HttpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});

let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (fn: (() => void) | null) => {
  onSessionExpired = fn;
};

// Single-flight refresh: concurrent failures share one /auth/refresh call.
let refreshing: Promise<unknown> | null = null;
const refreshSession = () => {
  if (!refreshing) {
    refreshing = api
      .post('/auth/refresh', null, { skipAuthRefresh: true })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

// The access token lives 1h. An expired token reaches the API as an anonymous request,
// which Spring answers with 401 or 403, so both trigger one refresh + retry.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig | undefined;
    const status = error.response?.status;
    const isAuthCall = config?.url?.startsWith('/auth/');

    if (config && (status === 401 || status === 403) && !config.skipAuthRefresh && !config._retried && !isAuthCall) {
      config._retried = true;
      try {
        await refreshSession();
        return api(config);
      } catch (refreshError) {
        // Only end the session if the server actually rejected the refresh token.
        if ((refreshError as AxiosError).response) onSessionExpired?.();
      }
    }
    return Promise.reject(error);
  },
);

export const statusOf = (err: unknown): number | undefined =>
  axios.isAxiosError(err) ? err.response?.status : undefined;

export function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Can't reach the server. Check your connection and try again.";
    if (err.response.status === 413) return 'That file is too large for the server.';
  }
  return fallback;
}
