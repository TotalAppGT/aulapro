import { useAuthStore } from "@/stores/auth.store"

const API_BASE = "/api"

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = useAuthStore.getState().token

  let url = `${API_BASE}${endpoint}`
  if (options.params) {
    const searchParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value))
      }
    })
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  const { params: _, ...fetchOptions } = options

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (response.status === 401) {
    useAuthStore.getState().logout()
    window.location.href = "/login"
    throw new Error("Sesion expirada")
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || data.message || `Error del servidor (${response.status})`)
  }

  return response.json()
}

export function apiPost<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return api<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function apiGet<T = unknown>(
  endpoint: string,
  params?: ApiOptions["params"]
): Promise<T> {
  return api<T>(endpoint, { method: "GET", params })
}

export function apiPut<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return api<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function apiPatch<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return api<T>(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function apiDelete<T = unknown>(endpoint: string): Promise<T> {
  return api<T>(endpoint, { method: "DELETE" })
}
