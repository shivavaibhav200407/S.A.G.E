import { request, setTokens, clearTokens } from './api';

export interface AuthResponse {
  access: string;
  refresh: string;
  username?: string;
  message?: string;
}

export interface RegisterPayload {
  username: string;
  password?: string;
  email?: string;
  target_topic?: string;
}

export async function login(username: string, password?: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/api/token/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setTokens(data.access, data.refresh);
  localStorage.setItem('sage_username', username);
  return data;
}

export async function demoLogin(): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/api/demo-login/', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  setTokens(data.access, data.refresh);
  localStorage.setItem('sage_username', data.username || 'demo_student');
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/api/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data.access) {
    setTokens(data.access, data.refresh);
    localStorage.setItem('sage_username', payload.username);
  }
  return data;
}

export function logout(): void {
  clearTokens();
}
