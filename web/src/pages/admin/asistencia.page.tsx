import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarCheck, Loader2, Save, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"

interface Alumno {
  id: string
  nombre: string
  apellido: string | null
  grado: { id: string; nombre: string } | null
}

interface Grado {
  id: string
  nombre: string
  _count: { alumnos: number }
}

type EstadoAsistencia = "PRESENTE" | "AUSENTE" | "TARDE" | "EXCUSA"

export default function AsistenciaPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [gradoId, setGradoId] = useState("")
  const [registros, setRegistros] = useState<Record<string, EstadoAsistencia>>({})

  const { data: grados } = useQuery<Grado[]>({
    queryKey: ["grados", user?.colegioId],
    queryFn: () => apiGet<Grado[]>(`/${user?.colegioId}/grados`),
    enabled: !!user?.colegioId,
  })

  const { data: alumnos, isLoading } = useQuery<Alumno[]>({
    queryKey: ["alumnos-grado", user?.colegioId, gradoId],
    queryFn: () => apiGet<Alumno[]>(`/${user?.colegioId}/alumnos`),
    enabled: !!user?.colegioId && !!gradoId,
    select: (data) => data.filter((a) => a.grado?.id === gradoId),
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      apiPost(`/${user?.colegioId}/asistencias`, {
        alumnos: (alumnos ?? []).map((a) => ({
          alumnoId: a.id,
          estado: registros[a.id] || "PRESENTE",
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asistencias"] })
      setRegistros({})
    },
  })

  const today = new Date().toLocaleDateString("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
          <p className="text-sm text-gray-500">
            Registro de asistencia del dia - {today}
          </p>
        </div>
        <select
          value={gradoId}
          onChange={(e) => setGradoId(e.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        >
          <option value="">Selecciona un grado</option>
          {(grados ?? []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre} ({g._count.alumnos} alumnos)
            </option>
          ))}
        </select>
      </div>

      {!gradoId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarCheck className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              Selecciona un grado para registrar la asistencia
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (alumnos ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No hay alumnos en este grado
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Alumnos del grado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 pr-4 font-medium text-gray-500">Alumno</th>
                    <th className="pb-3 font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(alumnos ?? []).map((alumno) => (
                    <tr key={alumno.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {alumno.nombre} {alumno.apellido}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          {(["PRESENTE", "TARDE", "AUSENTE", "EXCUSA"] as const).map(
                            (estado) => {
                              const active = registros[alumno.id] === estado
                              const color =
                                estado === "PRESENTE"
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : estado === "TARDE"
                                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                  : estado === "AUSENTE"
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              return (
                                <button
                                  key={estado}
                                  onClick={() =>
                                    setRegistros({
                                      ...registros,
                                      [alumno.id]: active ? undefined! : estado,
                                    })
                                  }
                                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                    active ? color : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  }`}
                                >
                                  {estado}
                                </button>
                              )
                            }
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Asistencia
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="success">PRESENTE</Badge>
        <Badge variant="warning">TARDE</Badge>
        <Badge variant="destructive">AUSENTE</Badge>
        <Badge variant="secondary">EXCUSA</Badge>
      </div>
    </div>
  )
}
