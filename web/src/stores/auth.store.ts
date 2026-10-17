import { create } from "zustand"
import { apiGet, apiPost } from "@/lib/api"

export type Role = "SUPERADMIN" | "ADMIN_COLEGIO" | "PROFESOR" | "PADRE" | "ALUMNO" | "AFILIADO"

interface User {
  id: string
  email: string
  nombre: string
  rol: Role
  colegioId: string
  colegioNombre: string
  colegioLogo: string | null
  avatarUrl?: string | null
  alumnoId?: string | null
  gradoId?: string | null
}

interface RegisterData {
  nombreColegio: string
  nombreAdmin: string
  email: string
  password: string
  telefono?: string
  direccion?: string
  codigoReferido?: string
}

interface BackendAuthResponse {
  token: string
  usuario: {
    id: string
    email: string
    nombre: string
    rol: Role
    telefono?: string
    avatarUrl?: string | null
    alumnoId?: string | null
    gradoId?: string | null
  }
  colegio: {
    id: string
    nombre: string
    estado: string
    plan?: string
    logoUrl?: string | null
  }
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginAfiliado: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => void
  refresh: () => Promise<void>
  isAuthenticated: () => boolean
}

const LAST_PATH_KEY = "aulapro:lastPath"

export function saveLastPath(path: string) {
  if (path.startsWith("/app")) {
    localStorage.setItem(LAST_PATH_KEY, path)
  }
}

export function getLastPath(): string | null {
  const path = localStorage.getItem(LAST_PATH_KEY)
  return path && path.startsWith("/app") ? path : null
}

function applyAuthSession(token: string, data: BackendAuthResponse) {
  const user: User = {
    id: data.usuario.id,
    email: data.usuario.email,
    nombre: data.usuario.nombre,
    rol: data.usuario.rol,
    colegioId: data.colegio.id,
    colegioNombre: data.colegio.nombre,
    colegioLogo: data.colegio.logoUrl ?? null,
    avatarUrl: data.usuario.avatarUrl,
    alumnoId: data.usuario.alumnoId ?? null,
    gradoId: data.usuario.gradoId ?? null,
  }
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user))
  return { user, token }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const data = await apiPost<BackendAuthResponse>("/auth/login", { email, password })
      const { user, token } = applyAuthSession(data.token, data)
      set({ user, token })
    } finally {
      set({ loading: false })
    }
  },

  loginAfiliado: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const data = await apiPost<BackendAuthResponse & { codigo?: string }>("/afiliados/login", {
        email,
        password,
      })
      const { user, token } = applyAuthSession(data.token, data)
      set({ user, token })
    } finally {
      set({ loading: false })
    }
  },

  register: async (data: RegisterData) => {
    set({ loading: true })
    try {
      const result = await apiPost<BackendAuthResponse>("/auth/registro", {
        nombreColegio: data.nombreColegio,
        nombre: data.nombreAdmin,
        email: data.email,
        password: data.password,
        telefono: data.telefono,
        codigoReferido: data.codigoReferido,
      })
      const { user, token } = applyAuthSession(result.token, result)
      set({ user, token })
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    set({ user: null, token: null })
  },

  loadFromStorage: () => {
    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("user")
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        set({ token, user })
      } catch {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
  },

  refresh: async () => {
    const token = get().token
    if (!token) return
    try {
      const data = await apiGet<{
        usuario: { id: string; email: string; nombre: string; rol: Role; colegioId: string; avatarUrl?: string | null; alumnoId?: string | null; gradoId?: string | null }
        colegio: { id: string; nombre: string; logoUrl?: string | null }
      }>("/auth/me")
      const user: User = {
        id: data.usuario.id,
        email: data.usuario.email,
        nombre: data.usuario.nombre,
        rol: data.usuario.rol,
        colegioId: data.usuario.colegioId,
        colegioNombre: data.colegio.nombre,
        colegioLogo: data.colegio.logoUrl ?? null,
        avatarUrl: data.usuario.avatarUrl,
        alumnoId: data.usuario.alumnoId ?? null,
        gradoId: data.usuario.gradoId ?? null,
      }
      localStorage.setItem("user", JSON.stringify(user))
      set({ user })
    } catch {
      await get().logout()
    }
  },

  isAuthenticated: () => {
    return !!get().token && !!get().user
  },
}))
