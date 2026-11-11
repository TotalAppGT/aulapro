import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, Loader2, CreditCard, Sparkles, Ticket, Calendar } from "lucide-react"
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

const MESES_GRATIS_ANUAL = 2

export default function PlanesPage() {
  const user = useAuthStore((s) => s.user)
  const [ciclo, setCiclo] = useState<"mensual" | "anual">("mensual")
  const [cupon, setCupon] = useState("")
  const [cargando, setCargando] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")

  const { data: me, refetch } = useQuery<{ colegio: { plan: string; estado: string; trialEndsAt: string | null } }>({
    queryKey: ["me-plan", user?.colegioId],
    queryFn: () => apiGet(`/auth/me`),
    enabled: !!user?.colegioId,
  })

  const planActual = me?.colegio?.plan

  const precioDe = (plan: PlanDef) => (ciclo === "anual" ? plan.precio * (12 - MESES_GRATIS_ANUAL) : plan.precio)

  const comprar = async (plan: PlanDef) => {
    setError("")
    setMensaje("")
    setCargando(plan.id)
    try {
      const data = await apiPost<any>(`/${user?.colegioId}/pagos/suscripcion/checkout`, {
        plan: plan.id,
        ciclo,
        cupon: cupon.trim() || undefined,
      })
      if (data.trial_activado) {
        setMensaje(`Trial activado: ${data.dias} dias en el plan ${data.plan}. ${data.cupon}`)
        await refetch()
      } else if (data.checkout_url) {
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

      <div className="flex flex-wrap items-center gap-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setCiclo("mensual")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${ciclo === "mensual" ? "bg-primary text-white" : "text-gray-600"}`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setCiclo("anual")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${ciclo === "anual" ? "bg-primary text-white" : "text-gray-600"}`}
          >
            Anual
          </button>
        </div>
        {ciclo === "anual" && (
          <Badge variant="success">
            <Calendar className="mr-1 h-3 w-3" /> 2 meses gratis
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={cupon}
            onChange={(e) => setCupon(e.target.value.toUpperCase())}
            placeholder="Codigo de cupon (opcional)"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <p className="text-xs text-gray-400">Prueba: BIENVENIDA (30 dias gratis) o LANZAMIENTO20 (20% dcto)</p>
      </div>

      {mensaje && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{mensaje}</div>}
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANES.map((plan) => {
          const esActual = planActual === plan.id
          const precio = precioDe(plan)
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
                  <span className="text-4xl font-extrabold text-gray-900">{formatCurrency(precio)}</span>
                  <span className="text-sm text-gray-400"> /{ciclo === "anual" ? "año" : "mes"}</span>
                  {ciclo === "anual" && (
                    <p className="text-xs text-gray-400">
                      Equivale a {formatCurrency(Math.round(precio / 12))}/mes
                    </p>
                  )}
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
