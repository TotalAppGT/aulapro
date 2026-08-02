import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save, Building2, CreditCard } from "lucide-react"
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
    plan: string
    estado: string
    trialEndsAt: string | null
  }
}

export default function ConfiguracionPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ nombre: "", direccion: "", telefono: "" })

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
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colegio"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
    },
  })

  const colegio = data?.colegio

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="text-sm text-gray-500">
          Datos generales del colegio y del plan
        </p>
      </div>

      {isLoading || !colegio ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
