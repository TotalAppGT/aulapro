import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Bell,
  Plus,
  Trash2,
  Loader2,
  CalendarClock,
  Pause,
  Play,
  Send,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api"
import { formatDate } from "@/lib/utils"

type Frecuencia = "UNA_SOLA_VEZ" | "DIARIA" | "SEMANAL" | "MENSUAL"

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  canal: string
  frecuencia: Frecuencia
  hora: string
  diaSemana: number | null
  diaMes: number | null
  roles: string[]
  telefonos: string[]
  activa: boolean
  ultimoEnvioAt: string | null
  proximoEnvioAt: string | null
  enviadoVeces: number
  createdAt: string
}

const FREC_LABEL: Record<Frecuencia, string> = {
  UNA_SOLA_VEZ: "Una vez",
  DIARIA: "Diaria",
  SEMANAL: "Semanal",
  MENSUAL: "Mensual",
}

const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
  { value: 7, label: "Domingo" },
]

interface FormState {
  titulo: string
  mensaje: string
  canal: "WHATSAPP" | "EMAIL"
  frecuencia: Frecuencia
  hora: string
  diaSemana: number | ""
  diaMes: number | ""
  roles: string[]
  telefonos: string
}

const emptyForm: FormState = {
  titulo: "",
  mensaje: "",
  canal: "WHATSAPP",
  frecuencia: "UNA_SOLA_VEZ",
  hora: "08:00",
  diaSemana: "",
  diaMes: "",
  roles: ["PADRE"],
  telefonos: "",
}

const CANAL_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "Correo electronico",
}

const ROLE_OPTIONS = [
  { value: "PADRE", label: "Padres de familia" },
  { value: "PROFESOR", label: "Profesores" },
  { value: "ADMIN_COLEGIO", label: "Administradores" },
  { value: "ALUMNO", label: "Alumnos (via responsable)" },
]

export default function NotificacionesPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  const { data: notificaciones, isLoading } = useQuery<Notificacion[]>({
    queryKey: ["notificaciones", user?.colegioId],
    queryFn: () => apiGet<Notificacion[]>(`/${user?.colegioId}/notificaciones`),
    staleTime: 30000,
  })

  const createMutation = useMutation({
    mutationFn: (data: unknown) =>
      apiPost(`/${user?.colegioId}/notificaciones`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })
      setShowForm(false)
      setForm(emptyForm)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (n: Notificacion) =>
      apiPatch(`/${user?.colegioId}/notificaciones/${n.id}`, { activa: !n.activa }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/${user?.colegioId}/notificaciones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })
    },
  })

  const sendNowMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/${user?.colegioId}/notificaciones/${id}/enviar-ahora`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })
    },
  })

  const handleSubmit = () => {
    const telefonos = form.telefonos
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    createMutation.mutate({
      titulo: form.titulo,
      mensaje: form.mensaje,
      canal: form.canal,
      frecuencia: form.frecuencia,
      hora: form.hora,
      diaSemana: form.diaSemana === "" ? null : Number(form.diaSemana),
      diaMes: form.diaMes === "" ? null : Number(form.diaMes),
      roles: form.roles,
      telefonos,
      activa: true,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-sm text-gray-500">
            Alertas programadas por WhatsApp (una vez, diaria, semanal o mensual)
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Notificacion
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Programar Notificacion</CardTitle>
            <CardDescription>
              Se enviara a los numeros de WhatsApp de los destinatarios seleccionados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Titulo</label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Recordatorio de pago"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Canal</label>
                <select
                  value={form.canal}
                  onChange={(e) => setForm({ ...form, canal: e.target.value as "WHATSAPP" | "EMAIL" })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Correo electronico</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Frecuencia</label>
                <select
                  value={form.frecuencia}
                  onChange={(e) => setForm({ ...form, frecuencia: e.target.value as Frecuencia })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {Object.entries(FREC_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mensaje</label>
              <textarea
                value={form.mensaje}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                rows={3}
                placeholder="Escribe el mensaje que se enviara..."
                className="w-full rounded-md border border-gray-300 p-3 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hora</label>
                <Input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                />
              </div>
              {form.frecuencia === "SEMANAL" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Dia de la semana</label>
                  <select
                    value={form.diaSemana}
                    onChange={(e) => setForm({ ...form, diaSemana: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {DIAS_SEMANA.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.frecuencia === "MENSUAL" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Dia del mes (1-28)</label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={form.diaMes}
                    onChange={(e) => setForm({ ...form, diaMes: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Destinatarios</label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      const current = form.roles
                      setForm({
                        ...form,
                        roles: current.includes(r.value)
                          ? current.filter((x) => x !== r.value)
                          : [...current, r.value],
                      })
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.roles.includes(r.value)
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <label className="mb-1 mt-3 block text-sm font-medium text-gray-700">
                {form.canal === "EMAIL"
                  ? "Se enviara al email de los roles seleccionados"
                  : "Numeros adicionales (separados por coma, con codigo de pais)"}
              </label>
              {form.canal === "EMAIL" ? (
                <p className="text-xs text-gray-400">
                  No se necesitan numeros; el sistema usa el email de cada usuario.
                </p>
              ) : (
                <Input
                  value={form.telefonos}
                  onChange={(e) => setForm({ ...form, telefonos: e.target.value })}
                  placeholder="50251234567, 50259876543"
                />
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || !form.titulo.trim() || !form.mensaje.trim()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Programar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones Programadas</CardTitle>
          <CardDescription>Gestiona tus alertas programadas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !notificaciones || notificaciones.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                No hay notificaciones programadas. Crea la primera.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificaciones.map((n) => (
                <div
                  key={n.id}
                  className={`flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between ${
                    n.activa ? "border-gray-200" : "border-gray-200 bg-gray-50 opacity-70"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{n.titulo}</p>
                      <Badge variant={n.activa ? "success" : "secondary"}>
                        {n.activa ? "Activa" : "Pausada"}
                      </Badge>
                      <Badge variant="secondary">{FREC_LABEL[n.frecuencia]}</Badge>
                      <Badge variant="secondary">{CANAL_LABEL[n.canal] ?? n.canal}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{n.mensaje}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {n.hora}
                        {n.frecuencia === "SEMANAL" && n.diaSemana
                          ? ` · ${DIAS_SEMANA.find((d) => d.value === n.diaSemana)?.label}`
                          : ""}
                        {n.frecuencia === "MENSUAL" && n.diaMes ? ` · dia ${n.diaMes}` : ""}
                      </span>
                      <span>{n.enviadoVeces} enviada(s)</span>
                      {n.proximoEnvioAt && (
                        <span>Proximo: {formatDate(n.proximoEnvioAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendNowMutation.mutate(n.id)}
                      disabled={sendNowMutation.isPending}
                      title="Enviar ahora"
                    >
                      {sendNowMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMutation.mutate(n)}
                      disabled={toggleMutation.isPending}
                    >
                      {n.activa ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteMutation.mutate(n.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
