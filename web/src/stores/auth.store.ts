import { create } from "zustand"
import { apiPost } from "@/lib/api"

export type Role = "SUPERADMIN" | "ADMIN_COLEGIO" | "PROFESOR" | "PADRE" | "ALUMNO"

interface User {
  id: string
  email: string
  nombre: string
  rol: Role
  colegioId: string
  colegioNombre: string
  colegioLogo: string | null
  avatarUrl?: string | null
}

interface RegisterData {
  nombreColegio: string
  nombreAdmin: string
  email: string
  password: string
  telefono?: string
  direccion?: string
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
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => void
  isAuthenticated: () => boolean
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

  register: async (data: RegisterData) => {
    set({ loading: true })
    try {
      const result = await apiPost<BackendAuthResponse>("/auth/registro", {
        nombreColegio: data.nombreColegio,
        nombre: data.nombreAdmin,
        email: data.email,
        password: data.password,
        telefono: data.telefono,
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

  isAuthenticated: () => {
    return !!get().token && !!get().user
  },
}))
