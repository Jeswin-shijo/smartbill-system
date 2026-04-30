const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
const tokenStorageKey = 'smartbill_token'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  token?: string
  body?: unknown
  query?: Record<string, string | number | undefined | null>
}

function buildPath(path: string, query?: RequestOptions['query']) {
  if (!query) return path
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v == null || v === '') continue
    params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers()
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)

  const response = await fetch(`${apiBase}${buildPath(path, options.query)}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const payload = (await response.json().catch(() => ({}))) as { message?: string }

  if (!response.ok) {
    throw new ApiError(payload.message ?? `Request failed (${response.status})`, response.status)
  }
  return payload as T
}

export function getStoredToken() {
  return window.localStorage.getItem(tokenStorageKey) ?? ''
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(tokenStorageKey, token)
}

export function clearStoredToken() {
  window.localStorage.removeItem(tokenStorageKey)
}
