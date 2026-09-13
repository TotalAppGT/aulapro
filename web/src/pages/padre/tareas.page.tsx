import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Users, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"
import { formatDate } from "@/lib/utils"

interface Alumno {
  id: string
  nombre: string
  apellido: string | null
  codigo: string
  grado: { nombre: string } | null
  responsableId: string | null
}

interface Entrega {
  id: string
  estado: string
  archivos: string[]
  nota: number | null
  fechaEntrega: string | null
}

interface Tarea {
  id: string
  titulo: string
  materia: string
  descripcion: string | null
  fechaEntrega: string
  tipo: string
  entrega: Entrega | null
}

function estadoEntrega(t: Tarea): "pendiente" | "entregada" | "vencida" {
  if (t.entrega && t.entrega.estado !== "PENDIENTE") return "entregada"
  if (new Date(t.fechaEntrega) < new Date()) return "vencida"
  return "pendiente"
}

export default function TareasPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [entregando, setEntregando] = useState<Record<string, boolean>>({})

  const { data: hijos, isLoading } = useQuery<Alumno[]>({
    queryKey: ["hijos", user?.colegioId],
    queryFn: () => apiGet<Alumno[]>(`/${user?.colegioId}/alumnos`),
    enabled: !!user?.colegioId,
    select: (data) => data.filter((a) => a.responsableId === user?.id),
  })

  const tareasQueries = useQuery<Record<string, Tarea[]>>({
    queryKey: ["tareas-hijos", user?.colegioId, (hijos ?? []).map((h) => h.id).join(",")],
    queryFn: async () => {
      const resultado: Record<string, Tarea[]> = {}
      for (const hijo of hijos ?? []) {
        try {
          resultado[hijo.id] = await apiGet<Tarea[]>(`/${user?.colegioId}/tareas/alumno/${hijo.id}`)
        } catch {
          resultado[hijo.id] = []
        }
      }
      return resultado
    },
    enabled: !!user?.colegioId && (hijos ?? []).length > 0,
  })

  const entregarMutation = useMutation({
    mutationFn: ({ tareaId, alumnoId }: { tareaId: string; alumnoId: string }) =>
      apiPost(`/${user?.colegioId}/tareas/${tareaId}/entregar`, {
        alumnoId,
        archivos: [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas-hijos"] })
    },
    onSettled: () => {
      setEntregando({})
    },
  })

  const tareasPorHijo = tareasQueries.data ?? {}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    )
  }

  if ((hijos ?? []).length === 0) {
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
        <h1 className="text-2xl font-bold text-gray-900">Tareas de Mis Hijos</h1>
        <p className="text-sm text-gray-500">
          Revisa y entrega las tareas de tus hijos
        </p>
      </div>

      {hijos?.map((hijo) => {
        const tareas = tareasPorHijo[hijo.id] ?? []
        const pendientes = tareas.filter((t) => estadoEntrega(t) !== "entregada").length

        return (
          <Card key={hijo.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>
                    {hijo.nombre} {hijo.apellido}
                  </CardTitle>
                  <CardDescription>
                    {hijo.grado?.nombre || "Sin grado"} · {pendientes} pendiente(s)
                  </CardDescription>
                </div>
                <Badge variant={pendientes > 0 ? "warning" : "success"}>
                  {pendientes > 0 ? `${pendientes} por entregar` : "Todo al dia"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {tareasQueries.isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                </div>
              ) : tareas.length === 0 ? (
                <p className="text-sm text-gray-500">No hay tareas asignadas</p>
              ) : (
                <div className="space-y-3">
                  {tareas.map((tarea) => {
                    const estado = estadoEntrega(tarea)
                    const entregandoNow = entregando[tarea.id]
                    return (
                      <div
                        key={tarea.id}
                        className={`flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between ${
                          estado === "vencida" ? "border-red-200 bg-red-50" : "border-gray-100"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{tarea.titulo}</p>
                            <Badge variant="secondary">{tarea.materia}</Badge>
                          </div>
                          {tarea.descripcion && (
                            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                              {tarea.descripcion}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-400">
                            Entrega: {formatDate(tarea.fechaEntrega)}
                            {tarea.entrega?.nota != null && (
                              <span className="ml-2 font-medium text-green-700">
                                Nota: {tarea.entrega.nota}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              estado === "entregada"
                                ? "success"
                                : estado === "vencida"
                                ? "destructive"
                                : "warning"
                            }
                          >
                            {estado === "entregada"
                              ? "Entregada"
                              : estado === "vencida"
                              ? "Vencida"
                              : "Pendiente"}
                          </Badge>
                          {estado !== "entregada" && (
                            <Button
                              size="sm"
                              disabled={entregandoNow}
                              onClick={() => {
                                setEntregando({ [tarea.id]: true })
                                entregarMutation.mutate({ tareaId: tarea.id, alumnoId: hijo.id })
                              }}
                            >
                              {entregandoNow ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="mr-1 h-3 w-3" />
                              )}
                              Entregar
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700">
        <p className="font-medium">Como funciona</p>
        <p className="mt-1">
          El colegio crea el acceso de los padres con correo y contrasena. Al iniciar sesion veras
          las tareas de tus hijos, su estado y podras marcarlas como entregadas. Si tu hijo ya las
          entrego en el colegio, aparecera el estado "Entregada" con su nota.
        </p>
      </div>
    </div>
  )
}
