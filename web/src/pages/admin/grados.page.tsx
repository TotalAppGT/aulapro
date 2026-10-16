import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { GraduationCap, Plus, Loader2, Users, X, BookOpen, Clock, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"

interface Grado {
  id: string
  nombre: string
  nivel: string | null
  _count: { alumnos: number }
  profesorGuia: { id: string; nombre: string } | null
}

interface GradoDetalle {
  id: string
  nombre: string
  nivel: string | null
  profesorGuia: { id: string; nombre: string; email: string; telefono: string | null } | null
  alumnos: {
    id: string
    codigo: string
    nombre: string
    apellido: string | null
    activo: boolean
    responsable: { id: string; nombre: string; email: string } | null
  }[]
  cursos: {
    id: string
    nombre: string
    materia: { id: string; nombre: string } | null
    profesor: { id: string; nombre: string } | null
  }[]
  horarios: {
    id: string
    diaSemana: number
    horaInicio: string
    horaFin: string
    aula: string | null
    materia: { nombre: string } | null
  }[]
}

const DIAS = ["", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]

export default function GradosPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: "", nivel: "" })
  const [detalleId, setDetalleId] = useState<string | null>(null)

  const { data: grados, isLoading } = useQuery<Grado[]>({
    queryKey: ["grados", user?.colegioId],
    queryFn: () => apiGet<Grado[]>(`/${user?.colegioId}/grados`),
    enabled: !!user?.colegioId,
  })

  const { data: detalle, isLoading: cargandoDetalle } = useQuery<GradoDetalle>({
    queryKey: ["grado-detalle", user?.colegioId, detalleId],
    queryFn: () => apiGet<GradoDetalle>(`/${user?.colegioId}/grados/${detalleId}`),
    enabled: !!detalleId && !!user?.colegioId,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost(`/${user?.colegioId}/grados`, {
        nombre: form.nombre,
        nivel: form.nivel || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grados"] })
      setShowForm(false)
      setForm({ nombre: "", nivel: "" })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grados</h1>
          <p className="text-sm text-gray-500">
            Niveles y grados academicos de {user?.colegioNombre}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Grado
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Grado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre del Grado</label>
                <Input
                  placeholder="5to Primaria A"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nivel</label>
                <Input
                  placeholder="Primaria / Basico / Diversificado"
                  value={form.nivel}
                  onChange={(e) => setForm({ ...form, nivel: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.nombre}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (grados ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No hay grados registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(grados ?? []).map((grado) => (
            <button
              key={grado.id}
              onClick={() => setDetalleId(grado.id)}
              className="text-left transition-transform hover:-translate-y-0.5"
            >
              <Card className="cursor-pointer hover:border-primary-300 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{grado.nombre}</h3>
                      <p className="mt-1 text-sm text-gray-500">{grado.nivel || "Sin nivel"}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-gray-400" />
                      {grado._count.alumnos} alumnos
                    </div>
                    {grado.profesorGuia ? (
                      <span className="text-xs text-gray-500">Guia: {grado.profesorGuia.nombre}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Sin profesor guia</span>
                    )}
                  </div>
                  <p className="mt-3 text-xs font-medium text-primary">Ver detalle →</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {detalleId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {detalle?.nombre ?? "Cargando..."}
                </h3>
                <p className="text-sm text-gray-500">{detalle?.nivel || ""}</p>
              </div>
              <button
                onClick={() => setDetalleId(null)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {cargandoDetalle || !detalle ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
              </div>
            ) : (
              <div className="space-y-6 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <UserCheck className="h-4 w-4" /> Profesor guia
                    </div>
                    <p className="mt-1 font-semibold text-gray-900">
                      {detalle.profesorGuia?.nombre ?? "Sin asignar"}
                    </p>
                    {detalle.profesorGuia?.email && (
                      <p className="text-xs text-gray-500">{detalle.profesorGuia.email}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" /> Alumnos
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{detalle.alumnos.length}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpen className="h-4 w-4" /> Cursos
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{detalle.cursos.length}</p>
                  </div>
                </div>

                {detalle.cursos.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-gray-900">Materias / Cursos</h4>
                    <div className="flex flex-wrap gap-2">
                      {detalle.cursos.map((c) => (
                        <Badge key={c.id} variant="secondary">
                          {c.materia?.nombre ?? c.nombre}
                          {c.profesor ? ` · ${c.profesor.nombre}` : ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {detalle.horarios.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                      <Clock className="h-4 w-4" /> Horario
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-left text-gray-500">
                            <th className="pb-2 pr-3">Dia</th>
                            <th className="pb-2 pr-3">Hora</th>
                            <th className="pb-2 pr-3">Materia</th>
                            <th className="pb-2">Aula</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalle.horarios.map((h) => (
                            <tr key={h.id} className="border-b border-gray-50 last:border-0">
                              <td className="py-1.5 pr-3 text-gray-600">{DIAS[h.diaSemana]}</td>
                              <td className="py-1.5 pr-3 text-gray-600">
                                {h.horaInicio} - {h.horaFin}
                              </td>
                              <td className="py-1.5 pr-3 font-medium text-gray-800">
                                {h.materia?.nombre ?? "-"}
                              </td>
                              <td className="py-1.5 text-gray-500">{h.aula ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">
                    Alumnos ({detalle.alumnos.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500">
                          <th className="pb-2 pr-4">Codigo</th>
                          <th className="pb-2 pr-4">Alumno</th>
                          <th className="pb-2 pr-4">Responsable</th>
                          <th className="pb-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalle.alumnos.map((a) => (
                          <tr key={a.id} className="border-b border-gray-50 last:border-0">
                            <td className="py-2 pr-4 text-gray-500">{a.codigo}</td>
                            <td className="py-2 pr-4 font-medium text-gray-900">
                              {a.nombre} {a.apellido}
                            </td>
                            <td className="py-2 pr-4 text-gray-600">
                              {a.responsable?.nombre ?? "-"}
                            </td>
                            <td className="py-2">
                              <Badge variant={a.activo ? "success" : "secondary"}>
                                {a.activo ? "Activo" : "Inactivo"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
