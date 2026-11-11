import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, Loader2, CreditCard, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface PlanDef {
  id: "STARTER" | "PRO" | "BUSINESS"
  nombre: string
  precio: number
  alumnos: string
  popular?: boolean
  features: string[]
}

const PLANES: PlanDef[] = [
  {
    id: "STARTER",
    nombre: "Basico",
    precio: 149,
    alumnos: "Hasta 100 alumnos",
    features: ["Alumnos, grados y materias", "Notas y boletas PDF", "Asistencia (QR + manual)", "Control de cuotas", "Portal de padres", "Reportes basicos"],
  },
  {
    id: "PRO",
    nombre: "Pro",
    precio: 349,
    alumnos: "Hasta 400 alumnos",
    popular: true,
    features: ["Todo lo del plan Basico", "WhatsApp y correos automaticos", "Aula virtual (cursos, tareas, evaluaciones)", "Asistencia automatica + reporte a padres", "Dashboard y reportes avanzados", "Multiples usuarios"],
  },
  {
    id: "BUSINESS",
    nombre: "Business",
    precio: 599,
    alumnos: "Alumnos ilimitados",
    features: ["Todo lo del plan Pro", "Multi-sede ilimitada", "API e integraciones", "Soporte prioritario", "Personalizacion de marca"],
  },
]

export default function PlanesPage() {
  const user = useAuthStore((s) => s.user)
  const [cargando, setCargando] = useState<string | null>(null)
  const [error, setError] = useState("")

  const { data: me } = useQuery<{ colegio: { plan: string; estado: string; trialEndsAt: string | null } }>({
    queryKey: ["me-plan", user?.colegioId],
    queryFn: () => apiGet(`/auth/me`),
    enabled: !!user?.colegioId,
  })

  const planActual = me?.colegio?.plan

  const comprar = async (plan: PlanDef) => {
    setError("")
    setCargando(plan.id)
    try {
      const data = await apiPost<{ checkout_url?: string }>(`/${user?.colegioId}/pagos/suscripcion/checkout`, { plan: plan.id })
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        setError("No se pudo generar el link de pago.")
      }
    } catch (err) {
      setError((err as Error).message || "Error al iniciar el pago")
    } finally {
      setCargando(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plan y facturacion</h1>
        <p className="text-sm text-gray-500">
          {planActual ? `Tu plan actual: ${planActual}` : "Elige el plan de tu colegio"}
          {me?.colegio?.estado ? ` · Estado: ${me.colegio.estado}` : ""}
        </p>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANES.map((plan) => {
          const esActual = planActual === plan.id
          return (
            <Card key={plan.id} className={plan.popular ? "border-primary-400 shadow-lg" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.nombre}</CardTitle>
                  {plan.popular && <Badge variant="success">Recomendado</Badge>}
                  {esActual && <Badge variant="secondary">Tu plan</Badge>}
                </div>
                <p className="text-sm text-gray-500">{plan.alumnos}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-4xl font-extrabold text-gray-900">{formatCurrency(plan.precio)}</span>
                  <span className="text-sm text-gray-400"> /mes</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span className="text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={cargando !== null || esActual}
                  onClick={() => comprar(plan)}
                >
                  {cargando === plan.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : esActual ? (
                    <Sparkles className="mr-2 h-4 w-4" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  {esActual ? "Plan actual" : "Suscribirme"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-gray-400">
        El pago se procesa de forma segura con Recurrente. Al completar el pago, tu plan se activa automaticamente.
      </p>
    </div>
  )
}
