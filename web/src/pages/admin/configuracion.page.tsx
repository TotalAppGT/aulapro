import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Loader2,
  Save,
  Building2,
  CreditCard,
  Users,
  Wallet,
  AlertTriangle,
  Settings,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPatch } from "@/lib/api"

interface ColegioData {
  colegio: {
    id: string
    nombre: string
    direccion: string | null
    telefono: string | null
    emailAdmin: string
    logoUrl: string | null
    plan: string
    estado: string
    trialEndsAt: string | null
    config: Record<string, unknown>
  }
  stats: {
    totalAlumnos: number
    pagosMes: number
    mora: number
  }
}

export default function ConfiguracionPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ nombre: "", direccion: "", telefono: "", logoUrl: "" })

  const { data, isLoading } = useQuery<ColegioData>({
    queryKey: ["colegio", user?.colegioId],
    queryFn: () => apiGet<ColegioData>(`/colegio`),
    enabled: !!user?.colegioId,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      apiPatch(`/colegio`, {
        nombre: form.nombre || undefined,
        direccion: form.direccion || undefined,
        telefono: form.telefono || undefined,
        logoUrl: form.logoUrl || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colegio"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
    },
  })

  const configMutation = useMutation({
    mutationFn: (config: Record<string, unknown>) => apiPatch(`/colegio`, { config }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colegio"] })
    },
  })

  const colegio = data?.colegio
  const stats = data?.stats

  const notificacionesWhatsapp = Boolean(colegio?.config?.notificacionesWhatsapp)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="text-sm text-gray-500">
          Datos generales del colegio, plan y preferencias del sistema
        </p>
      </div>

      {isLoading || !colegio ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-3 pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Alumnos activos</p>
                    <p className="text-xl font-bold text-gray-900">{stats.totalAlumnos}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pagos del mes</p>
                    <p className="text-xl font-bold text-gray-900">{stats.pagosMes}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">En mora</p>
                    <p className="text-xl font-bold text-gray-900">{stats.mora}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Datos del Colegio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nombre del Colegio
                  </label>
                  <Input
                    placeholder={colegio.nombre}
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Direccion</label>
                  <Input
                    placeholder={colegio.direccion || "Direccion"}
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Telefono</label>
                  <Input
                    placeholder={colegio.telefono || "Telefono"}
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Logo (URL)</label>
                  <Input
                    placeholder={colegio.logoUrl || "https://..."}
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Admin</label>
                  <Input value={colegio.emailAdmin} disabled />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Plan y Suscripcion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Plan Actual</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {colegio.plan}
                    </span>
                    <Badge variant="success">Activo</Badge>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Estado</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {colegio.estado}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Siguiente Factura</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {colegio.trialEndsAt
                      ? new Date(colegio.trialEndsAt).toLocaleDateString("es-GT")
                      : "N/D"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Preferencias del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Notificaciones por WhatsApp
                  </p>
                  <p className="text-sm text-gray-500">
                    Habilita los recordatorios y alertas por WhatsApp para este colegio
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificacionesWhatsapp}
                  onClick={() =>
                    configMutation.mutate({
                      ...(colegio.config as Record<string, unknown>),
                      notificacionesWhatsapp: !notificacionesWhatsapp,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                    notificacionesWhatsapp ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificacionesWhatsapp ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Moneda</p>
                  <p className="text-sm text-gray-500">
                    Todos los montos se muestran en Quetzales (GTQ)
                  </p>
                </div>
                <Badge variant="secondary">Q (GTQ)</Badge>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
