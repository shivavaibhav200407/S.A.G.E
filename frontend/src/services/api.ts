/**
 * Centralized API Client for SAGE Platform
 * Handles JWT token storage, automatic Authorization headers, token refreshes, and structured errors.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem('sage_access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('sage_refresh_token');
}

export function setTokens(access: string, refresh?: string): void {
  localStorage.setItem('sage_access_token', access);
  if (refresh) {
    localStorage.setItem('sage_refresh_token', refresh);
  }
}

export function clearTokens(): void {
  localStorage.removeItem('sage_access_token');
  localStorage.removeItem('sage_refresh_token');
  localStorage.removeItem('sage_username');
}

export interface SageRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function request<T = any>(endpoint: string, options: SageRequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});
  const timeoutMs = options.timeoutMs ?? 55000; // 55s client-side timeout before 60s hard ceiling

  // Append Bearer token if present and not already set
  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default JSON Content-Type if body is string and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const signal = options.signal || controller.signal;

  try {
    let response = await fetch(url, { ...options, headers, signal });

    // Handle 401 Unauthorized by attempting token refresh once
    if (response.status === 401 && getRefreshToken() && !endpoint.includes('/token/')) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${getAccessToken()}`);
        if (options.body && !(options.body instanceof FormData) && !retryHeaders.has('Content-Type')) {
          retryHeaders.set('Content-Type', 'application/json');
        }
        response = await fetch(url, { ...options, headers: retryHeaders, signal });
      }
    }

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/token/')) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sage:unauthorized'));
        }
      }

      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }

      let errorMessage = `Server responded with status ${response.status}`;
      if (response.status === 401) {
        errorMessage = 'Session expired or unauthorized. Please log in again.';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden. You do not have permission for this resource.';
      } else if (response.status === 404) {
        errorMessage = `API endpoint not found: ${endpoint}`;
      } else if (response.status === 504) {
        errorMessage = 'AI generation timed out. Please try again.';
      } else if (response.status >= 500) {
        errorMessage = `Internal server error (${response.status}) in SAGE backend.`;
      }

      if (errorData) {
        if (typeof errorData === 'string' && errorData.trim()) errorMessage = errorData;
        else if (errorData.detail) errorMessage = errorData.detail;
        else if (errorData.error) errorMessage = errorData.error;
        else if (errorData.message) errorMessage = errorData.message;
        else {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && Array.isArray(errorData[firstKey])) {
            errorMessage = `${firstKey}: ${errorData[firstKey][0]}`;
          }
        }
      }

      // Safe error logging during development
      if (import.meta.env.DEV) {
        console.warn(`[SAGE API Error ${response.status}] ${options.method || 'GET'} ${url}:`, {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          data: errorData,
        });
      }

      throw new ApiError(errorMessage, response.status, errorData);
    }

    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (err?.name === 'AbortError' || controller.signal.aborted) {
      throw new ApiError('AI generation timed out after 55 seconds. Please try again.', 504);
    }
    if (import.meta.env.DEV) {
      console.error(`[SAGE Network Failure] ${options.method || 'GET'} ${url}:`, err);
    }
    throw new ApiError(err.message || 'Network request failed. Is the SAGE backend running on port 8000?', 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function attemptTokenRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const res = await fetch(`${BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access) {
        setTokens(data.access, data.refresh || refresh);
        return true;
      }
    }
  } catch {
    // Refresh failed
  }

  clearTokens();
  return false;
}
