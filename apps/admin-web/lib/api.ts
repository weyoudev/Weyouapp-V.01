import axios, { type AxiosError } from 'axios';
import { getToken } from './auth';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003/api';

/** Origin of the API server (e.g. http://localhost:3003) for building absolute URLs like PDF links. */
export function getApiOrigin(): string {
  const u = API_BASE_URL.replace(/\/api\/?$/, '');
  return u || 'http://localhost:3003';
}

const baseURL = API_BASE_URL;

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    const err = data && typeof data === 'object' && 'error' in data
      ? (data.error as { code?: string; message?: string })
      : null;
    if (err?.message) {
      return {
        message: err.message,
        code: err.code,
        status: error.response?.status,
      };
    }
    const msg = data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string'
      ? (data as { message: string }).message
      : error.message || `Request failed with status ${error.response?.status ?? 'unknown'}`;
    return { message: msg, status: error.response?.status };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'An unexpected error occurred' };
}

/** User-facing message: prefer API error.message, else fallback. Shorten schema message for toasts. */
export function getFriendlyErrorMessage(error: unknown): string {
  const api = getApiError(error);
  if (api.code === 'SCHEMA_OUT_OF_DATE') {
    return 'Database schema is out of date. From repo root run: npm run prisma:migrate then npm run prisma:generate, then restart the API (npm run dev:api).';
  }
  if (axios.isAxiosError(error) && (error.code === 'ERR_NETWORK' || !error.response)) {
    return `Cannot connect to the API at ${baseURL}. Make sure the API server is running (e.g. npm run dev:api from repo root) and that NEXT_PUBLIC_API_URL in apps/admin-web/.env.local matches (e.g. http://localhost:3005/api).`;
  }
  if (api.status === 401) {
    return 'Invalid email or password. Check that the user exists with role Admin/Billing/OPS and the password is correct.';
  }
  if (api.code === 'USER_DISABLED') {
    return 'This account is disabled. Contact an administrator.';
  }
  return api.message || 'Network/API error';
}

/** Full details string for "Copy error details". */
export function getApiErrorDetails(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const d = error.response?.data;
    const err = d && typeof d === 'object' && 'error' in d ? (d as { error?: { code?: string; message?: string } }).error : null;
    const status = error.response?.status;
    const parts = [
      status != null ? `Status: ${status}` : '',
      error.code ? `Code: ${error.code}` : '',
      err?.code ? `API Code: ${err.code}` : '',
      err?.message || error.message || 'Request failed',
    ];
    if ((error.code === 'ERR_NETWORK' || !error.response) && baseURL) {
      parts.push(`API URL: ${baseURL}`);
      parts.push('Ensure the API is running and NEXT_PUBLIC_API_URL is correct.');
    }
    return parts.filter(Boolean).join('\n');
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}
