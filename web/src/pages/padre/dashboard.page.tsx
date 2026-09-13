import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  Users,
  DollarSign,
  BookOpen,
  Megaphone,
  MessageSquare,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Star,
  Send,
  GraduationCap,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"
import { formatCurrency, formatDateShort } from "@/lib/utils"

interface Alumno {
  id: string
  nombre: string
  apellido: string | null
  codigo: string
  grado: { nombre: string } | null
  responsableId: string | null
}

interface NotaMateria {
  materia: { id: string; nombre: string }
  promedio: number
}

interface Entrega {
  id: string
  estado: string
  nota: number | null
}

interface Tarea {
  id: string
  titulo: string
  materia: string
  fechaEntrega: string
  entrega: Entrega | null
}

interface Mensualidad {
  id: string
  mes: string
  monto: number
  estado: string
  fechaPago: string | null
  fechaVencimiento: string | null
}

interface Anuncio {
  id: string
  titulo: string
  contenido: string
  createdAt: string
}

function currentBimestre(): number {
  const m = new Date().getMonth() + 1
  return m <= 3 ? 1 : m <= 6 ? 2 : m <= 9 ? 3 : 4
}

function mesLabel(mes: string): string {
  const [y, m] = mes.split("-").map(Number)
  const fecha = new Date(y, m - 1, 1)
  const label = fecha.toLocaleDateString("es-GT", { month: "long", year: "numeric" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function estadoTarea(t: Tarea): "pendiente" | "entregada" | "vencida" {
  if (t.entrega && t.entrega.estado !== "PENDIENTE") return "entregada"
  if (new Date(t.fechaEntrega) < new Date()) return "vencida"
  return "pendiente"
}

function getNotaColor(nota: number): string {
  if (nota >= 90) return "text-green-600"
  if (nota >= 70) return "text-yellow-600"
  return "text-red-600"
}

export default function PadreDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [activeHijo, setActiveHijo] = useState<string>("")
  const [mensajeTexto, setMensajeTexto] = useState("")

  const { data: hijos, isLoading: cargandoHijos } = useQuery<Alumno[]>({
    queryKey: ["hijos", user?.colegioId],
    queryFn: () => apiGet<Alumno[]>(`/${user?.colegioId}/alumnos`),
    enabled: !!user?.colegioId,
    select: (data) => data.filter((a) => a.responsableId === user?.id),
  })

  const hijoActual = hijos?.find((h) => h.id === activeHijo) ?? hijos?.[0] ?? null
  const hijoId = hijoActual?.id ?? ""

  const { data: notas } = useQuery<{ materias: NotaMateria[] }>({
    queryKey: ["notas-padre", user?.colegioId, hijoId],
    queryFn: () =>
      apiGet(`/${user?.colegioId}/calificaciones/alumno/${hijoId}/${currentBimestre()}`),
    enabled: !!user?.colegioId && !!hijoId,
  })

  const { data: tareas } = useQuery<Tarea[]>({
    queryKey: ["tareas-padre", user?.colegioId, hijoId],
    queryFn: () => apiGet<Tarea[]>(`/${user?.colegioId}/tareas/alumno/${hijoId}`),
    enabled: !!user?.colegioId && !!hijoId,
  })

  const { data: pagos } = useQuery<{ mensualidades: Mensualidad[] }>({
    queryKey: ["pagos-padre", user?.colegioId, hijoId],
    queryFn: () => apiGet(`/${user?.colegioId}/pagos/alumno/${hijoId}`),
    enabled: !!user?.colegioId && !!hijoId,
  })

  const { data: anuncios } = useQuery<Anuncio[]>({
    queryKey: ["anuncios", user?.colegioId],
    queryFn: () => apiGet<Anuncio[]>(`/${user?.colegioId}/anuncios`),
    enabled: !!user?.colegioId,
  })

  const mensajeMutation = useMutation({
    mutationFn: () => apiPost(`/${user?.colegioId}/mensajes`, { contenido: mensajeTexto }),
    onSuccess: () => {
      setMensajeTexto("")
      queryClient.invalidateQueries({ queryKey: ["mensajes"] })
    },
  })

  const notasMaterias = notas?.materias ?? []
  const tareasHijo = tareas ?? []
  const tareasPendientes = tareasHijo.filter((t) => estadoTarea(t) !== "entregada").length

  const mensualidades = pagos?.mensualidades ?? []
  const pagoPendiente = mensualidades.find((m) => m.estado !== "PAGADO")

  if (cargandoHijos) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    )
  }

  if (!hijoActual) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            No tienes hijos vinculados a esta cuenta
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {user?.nombre.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500">
          Panel de seguimiento para padres
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="mr-3 text-sm font-medium text-gray-700">Mis Hijos:</span>
            {hijos?.map((hijo) => (
              <button
                key={hijo.id}
                onClick={() => setActiveHijo(hijo.id)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  hijo.id === hijoActual.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {hijo.nombre} {hijo.apellido}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Grado</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {hijoActual.grado?.nombre || "Sin grado"}
                    </p>
                    <p className="text-xs text-gray-400">{hijoActual.codigo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${tareasPendientes > 0 ? "bg-yellow-50" : "bg-green-50"}`}>
                    <BookOpen
                      className={`h-5 w-5 ${
                        tareasPendientes > 0 ? "text-yellow-600" : "text-green-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Tareas Pendientes</p>
                    <p className="text-sm font-semibold text-gray-900">{tareasPendientes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      !pagoPendiente ? "bg-green-50" : "bg-yellow-50"
                    }`}
                  >
                    <DollarSign
                      className={`h-5 w-5 ${
                        !pagoPendiente ? "text-green-600" : "text-yellow-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Pago Pendiente</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {pagoPendiente ? formatCurrency(pagoPendiente.monto) : "Al dia"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <CardTitle>Resumen de Calificaciones</CardTitle>
              </div>
              <CardDescription>
                Promedios de {hijoActual.nombre} {hijoActual.apellido} (bimestre{" "}
                {currentBimestre()})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notasMaterias.length === 0 ? (
                <p className="text-sm text-gray-500">No hay notas registradas aun</p>
              ) : (
                <div className="space-y-3">
                  {notasMaterias.map((n) => (
                    <div
                      key={n.materia.id}
                      className="flex items-center justify-between rounded-md border border-gray-100 p-3"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {n.materia.nombre}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-32 rounded-full bg-gray-100">
                          <div
                            className={`h-2 rounded-full ${
                              n.promedio >= 90
                                ? "bg-green-500"
                                : n.promedio >= 70
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(n.promedio, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${getNotaColor(n.promedio)}`}>
                          {n.promedio}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>
                  Tareas de {hijoActual.nombre} {hijoActual.apellido}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {tareasHijo.length === 0 ? (
                <p className="text-sm text-gray-500">No hay tareas asignadas</p>
              ) : (
                <div className="space-y-3">
                  {tareasHijo.slice(0, 6).map((tarea) => {
                    const estado = estadoTarea(tarea)
                    return (
                      <div
                        key={tarea.id}
                        className={`flex items-center justify-between rounded-md border p-3 ${
                          estado === "vencida" ? "border-red-200 bg-red-50" : "border-gray-100"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tarea.titulo}</p>
                          <p className="text-xs text-gray-500">
                            {tarea.materia} &middot; Entrega: {formatDateShort(tarea.fechaEntrega)}
                            {tarea.entrega?.nota != null && (
                              <span className="ml-2 text-green-700">Nota: {tarea.entrega.nota}</span>
                            )}
                          </p>
                        </div>
                        <Badge
                          variant={
                            estado === "entregada"
                              ? "success"
                              : estado === "vencida"
                              ? "destructive"
                              : "warning"
                          }
                          className="text-[10px]"
                        >
                          {estado === "pendiente"
                            ? "Pendiente"
                            : estado === "vencida"
                            ? "Vencida"
                            : "Entregada"}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Pagos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {mensualidades.length === 0 ? (
                <p className="text-sm text-gray-500">No hay cobros registrados</p>
              ) : pagoPendiente ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {hijoActual.nombre} {hijoActual.apellido}
                      </p>
                      <p className="text-xs text-gray-500">
                        {mesLabel(pagoPendiente.mes)} &middot;{" "}
                        {formatCurrency(pagoPendiente.monto)}
                      </p>
                    </div>
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                  </div>
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    onClick={() =>
                      navigate(`/app/pagar?alumnoId=${hijoActual.id}&mes=${pagoPendiente.mes}`)
                    }
                  >
                    <DollarSign className="mr-1 h-4 w-4" />
                    Pagar ahora
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Todo al dia</p>
                      <p className="text-xs text-gray-500">
                        {hijoActual.nombre} {hijoActual.apellido} no tiene pagos pendientes
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Anuncios Recientes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(anuncios ?? []).slice(0, 4).map((anuncio) => (
                  <div key={anuncio.id} className="rounded-md border border-gray-100 p-3">
                    <p className="text-sm font-medium text-gray-900">{anuncio.titulo}</p>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">{anuncio.contenido}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatDateShort(anuncio.createdAt)}
                    </p>
                  </div>
                ))}
                {(anuncios ?? []).length === 0 && (
                  <p className="text-sm text-gray-500">No hay anuncios recientes</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Mensaje Rapido</CardTitle>
              </div>
              <CardDescription>Escribele a la direccion del colegio</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
                placeholder="Escribe tu mensaje..."
                value={mensajeTexto}
                onChange={(e) => setMensajeTexto(e.target.value)}
              />
              <Button
                className="mt-3 w-full"
                size="sm"
                disabled={!mensajeTexto.trim() || mensajeMutation.isPending}
                onClick={() => mensajeMutation.mutate()}
              >
                {mensajeMutation.isPending ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Send className="mr-1 h-3 w-3" />
                )}
                Enviar Mensaje
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
