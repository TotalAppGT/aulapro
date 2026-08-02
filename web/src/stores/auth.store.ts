import { create } from "zustand"
import { apiPost } from "@/lib/api"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type UserCredential,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

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
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await cred.user.getIdToken()
      const data = await apiPost<BackendAuthResponse>("/auth/firebase", { idToken })
      const { user, token } = applyAuthSession(data.token, data)
      set({ user, token })
    } finally {
      set({ loading: false })
    }
  },

  register: async (data: RegisterData) => {
    set({ loading: true })
    try {
      let cred: UserCredential
      try {
        cred = await createUserWithEmailAndPassword(auth, data.email, data.password)
      } catch (err: unknown) {
        const code = (err as { code?: string }).code
        if (code === "auth/email-already-in-use") {
          cred = await signInWithEmailAndPassword(auth, data.email, data.password)
        } else {
          throw err
        }
      }
      const idToken = await cred.user.getIdToken()
      const result = await apiPost<BackendAuthResponse>("/auth/firebase", {
        idToken,
        nombreColegio: data.nombreColegio,
        nombre: data.nombreAdmin,
        telefono: data.telefono,
      })
      const { user, token } = applyAuthSession(result.token, result)
      set({ user, token })
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    await signOut(auth).catch(() => {})
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
