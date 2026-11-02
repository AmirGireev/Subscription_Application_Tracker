// api url
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// fetch wrapper
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  // headers
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;

  // request
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.error === 'string' ? body.error : 'Request failed');
  }
  return res.status === 204 ? (undefined as T) : res.json();
}