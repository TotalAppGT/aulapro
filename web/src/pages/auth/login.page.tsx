import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { School, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth.store"

interface LoginError {
  email?: string
  password?: string
  general?: string
}

function errorMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code
  const map: Record<string, string> = {
    "auth/user-not-found": "No existe una cuenta con ese correo",
    "auth/wrong-password": "Contrasena incorrecta",
    "auth/invalid-credential": "Credenciales invalidas",
    "auth/invalid-email": "Correo invalido",
    "auth/too-many-requests": "Demasiados intentos. Intenta de nuevo mas tarde",
    "auth/network-request-failed": "Error de red. Verifica tu conexion",
  }
  return (code && map[code]) || (err instanceof Error ? err.message : "Error al iniciar sesion")
}

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const loading = useAuthStore((s) => s.loading)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginError>({})

  const validate = (): boolean => {
    const errs: LoginError = {}
    if (!email.trim()) {
      errs.email = "El correo es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Ingresa un correo valido"
    }
    if (!password) {
      errs.password = "La contrasena es requerida"
    } else if (password.length < 6) {
      errs.password = "La contrasena debe tener al menos 6 caracteres"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setErrors({})
    try {
      await login(email, password)
      navigate("/app")
    } catch (err: unknown) {
      setErrors({ general: errorMessage(err) })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <School className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold tracking-tight text-gray-900">
              AulaPro
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Gestion escolar inteligente
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesion</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                  {errors.general}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Correo Electronico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@colegio.edu.gt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Contrasena
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesion...
                  </>
                ) : (
                  "Iniciar Sesion"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">¿No tienes cuenta? </span>
              <Link
                to="/registro"
                className="font-medium text-primary hover:underline"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
