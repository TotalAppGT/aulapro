import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { School, ArrowLeft, ArrowRight, Check, Loader2, Building2, UserCircle, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth.store"

interface ColegioFields {
  nombre: string
  direccion: string
  telefono: string
}

interface AdminFields {
  nombre: string
  email: string
  password: string
  confirmPassword: string
}

interface FieldErrors {
  [key: string]: string
}

const STEPS = [
  { id: 1, label: "Datos del Colegio", icon: Building2 },
  { id: 2, label: "Cuenta Administrador", icon: UserCircle },
  { id: 3, label: "Confirmacion", icon: PartyPopper },
] as const

function errorMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code
  const map: Record<string, string> = {
    "auth/email-already-in-use": "Ese correo ya tiene una cuenta",
    "auth/weak-password": "La contrasena es demasiado debil",
    "auth/invalid-email": "Correo invalido",
    "auth/network-request-failed": "Error de red. Verifica tu conexion",
  }
  return (code && map[code]) || (err instanceof Error ? err.message : "Error al crear la cuenta")
}

export default function RegistroPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const loading = useAuthStore((s) => s.loading)

  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [colegio, setColegio] = useState<ColegioFields>({
    nombre: "",
    direccion: "",
    telefono: "",
  })

  const [admin, setAdmin] = useState<AdminFields>({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const validateStep1 = (): boolean => {
    const errs: FieldErrors = {}
    if (!colegio.nombre.trim()) errs.nombre = "El nombre del colegio es requerido"
    if (!colegio.direccion.trim()) errs.direccion = "La direccion es requerida"
    if (!colegio.telefono.trim()) {
      errs.telefono = "El telefono es requerido"
    } else if (!/^[\d\-+() ]{8,}$/.test(colegio.telefono.trim())) {
      errs.telefono = "Ingresa un telefono valido (min 8 digitos)"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = (): boolean => {
    const errs: FieldErrors = {}
    if (!admin.nombre.trim()) errs.nombre = "El nombre es requerido"
    if (!admin.email.trim()) {
      errs.email = "El correo es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email)) {
      errs.email = "Ingresa un correo valido"
    }
    if (!admin.password) {
      errs.password = "La contrasena es requerida"
    } else if (admin.password.length < 8) {
      errs.password = "La contrasena debe tener al menos 8 caracteres"
    }
    if (!admin.confirmPassword) {
      errs.confirmPassword = "Confirma tu contrasena"
    } else if (admin.password !== admin.confirmPassword) {
      errs.confirmPassword = "Las contrasenas no coinciden"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      handleSubmit()
    }
  }

  const handleBack = () => {
    setErrors({})
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    setErrors({})

    try {
      await register({
        nombreColegio: colegio.nombre,
        nombreAdmin: admin.nombre,
        email: admin.email,
        password: admin.password,
        telefono: colegio.telefono,
      })
      setStep(3)
    } catch (err: unknown) {
      setErrors({ general: errorMessage(err) })
    }
  }

  const goToDashboard = () => navigate("/app")

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <School className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold tracking-tight text-gray-900">
              AulaPro
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Comienza tu prueba gratuita de 14 dias
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s) => {
              const Icon = s.icon
              const isCompleted = step > s.id
              const isCurrent = step === s.id
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isCompleted
                        ? "border-primary bg-primary text-white"
                        : isCurrent
                        ? "border-primary bg-primary-50 text-primary"
                        : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isCurrent ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Datos del Colegio</CardTitle>
                <CardDescription>
                  Ingresa la informacion basica de tu institucion educativa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {errors.general && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                      {errors.general}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nombre del Colegio
                    </label>
                    <Input
                      placeholder="Colegio Mixto..."
                      value={colegio.nombre}
                      onChange={(e) =>
                        setColegio({ ...colegio, nombre: e.target.value })
                      }
                      className={errors.nombre ? "border-red-500" : ""}
                    />
                    {errors.nombre && (
                      <p className="text-xs text-red-500">{errors.nombre}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Direccion
                    </label>
                    <Input
                      placeholder="Zona, municipio, departamento"
                      value={colegio.direccion}
                      onChange={(e) =>
                        setColegio({ ...colegio, direccion: e.target.value })
                      }
                      className={errors.direccion ? "border-red-500" : ""}
                    />
                    {errors.direccion && (
                      <p className="text-xs text-red-500">{errors.direccion}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Telefono
                    </label>
                    <Input
                      placeholder="+502 XXXX XXXX"
                      value={colegio.telefono}
                      onChange={(e) =>
                        setColegio({ ...colegio, telefono: e.target.value })
                      }
                      className={errors.telefono ? "border-red-500" : ""}
                    />
                    {errors.telefono && (
                      <p className="text-xs text-red-500">{errors.telefono}</p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleNext}>
                    Siguiente
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Cuenta Administrador</CardTitle>
                <CardDescription>
                  Crea la cuenta del director o administrador del colegio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {errors.general && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                      {errors.general}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nombre Completo
                    </label>
                    <Input
                      placeholder="Director(a) Nombre"
                      value={admin.nombre}
                      onChange={(e) =>
                        setAdmin({ ...admin, nombre: e.target.value })
                      }
                      className={errors.nombre ? "border-red-500" : ""}
                    />
                    {errors.nombre && (
                      <p className="text-xs text-red-500">{errors.nombre}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Correo Electronico
                    </label>
                    <Input
                      type="email"
                      placeholder="director@colegio.edu.gt"
                      value={admin.email}
                      onChange={(e) =>
                        setAdmin({ ...admin, email: e.target.value })
                      }
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Contrasena
                    </label>
                    <Input
                      type="password"
                      placeholder="Minimo 8 caracteres"
                      value={admin.password}
                      onChange={(e) =>
                        setAdmin({ ...admin, password: e.target.value })
                      }
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Confirmar Contrasena
                    </label>
                    <Input
                      type="password"
                      placeholder="Repite tu contrasena"
                      value={admin.confirmPassword}
                      onChange={(e) =>
                        setAdmin({
                          ...admin,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Atras
                  </Button>
                  <Button onClick={handleNext} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        Crear Cuenta
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-center">
                  <PartyPopper className="mx-auto h-12 w-12 text-primary" />
                </CardTitle>
                <CardTitle className="text-center text-2xl">
                  ¡Tu prueba de 14 dias comienza ahora!
                </CardTitle>
                <CardDescription className="text-center text-base">
                  Has creado tu cuenta exitosamente. Disfruta de todas las
                  funcionalidades de AulaPro sin limite durante 14 dias.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-primary-50 p-4 text-center">
                  <p className="text-sm text-primary-800">
                    Te hemos enviado un correo de confirmacion a{" "}
                    <span className="font-semibold">{admin.email}</span> con
                    instrucciones para empezar.
                  </p>
                </div>
                <div className="mt-6">
                  <Button className="w-full" size="lg" onClick={goToDashboard}>
                    Ir al Panel de Control
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
