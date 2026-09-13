import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarCheck,
  Loader2,
  Save,
  Users,
  CheckCheck,
  Mail,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"

interface Alumno {
  id: string
  codigo: string
  cui: string | null
  nombre: string
  apellido: string | null
  grado: { id: string; nombre: string } | null
}

interface Grado {
  id: string
  nombre: string
  _count: { alumnos: number }
}

interface Materia {
  id: string
  nombre: string
}

type EstadoAsistencia = "PRESENTE" | "AUSENTE" | "TARDE" | "EXCUSA"

const ESTADOS: EstadoAsistencia[] = ["PRESENTE", "TARDE", "AUSENTE", "EXCUSA"]

const ESTADO_STYLE: Record<EstadoAsistencia, string> = {
  PRESENTE: "bg-green-100 text-green-700 hover:bg-green-200",
  TARDE: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  AUSENTE: "bg-red-100 text-red-700 hover:bg-red-200",
  EXCUSA: "bg-blue-100 text-blue-700 hover:bg-blue-200",
}

interface ResumenItem {
  alumnoId: string
  codigo: string
  alumno: string
  presentes: number
  ausentes: number
  tardes: number
  excusas: number
  total: number
  porcientoAsistencia: number
}

function todayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`
}

function currentMes(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export default function AsistenciaPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [gradoId, setGradoId] = useState("")
  const [materiaId, setMateriaId] = useState("")
  const [fecha, setFecha] = useState(todayStr())
  const [registros, setRegistros] = useState<Record<string, EstadoAsistencia>>({})

  const colegioId = user?.colegioId

  const { data: grados } = useQuery<Grado[]>({
    queryKey: ["grados", colegioId],
    queryFn: () => apiGet<Grado[]>(`/${colegioId}/grados`),
    enabled: !!colegioId,
  })

  const { data: materias } = useQuery<Materia[]>({
    queryKey: ["materias", colegioId],
    queryFn: () => apiGet<Materia[]>(`/${colegioId}/materias`),
    enabled: !!colegioId,
  })

  const { data: alumnos, isLoading } = useQuery<Alumno[]>({
    queryKey: ["alumnos-grado", colegioId, gradoId],
    queryFn: () => apiGet<Alumno[]>(`/${colegioId}/alumnos`),
    enabled: !!colegioId && !!gradoId,
    select: (data) => data.filter((a) => a.grado?.id === gradoId),
  })

  const { data: existente, isLoading: cargandoExistente } = useQuery<Record<string, string>>({
    queryKey: ["asistencias", colegioId, fecha, materiaId],
    queryFn: () =>
      apiGet<Record<string, string>>(
        `/${colegioId}/asistencias/fecha/${fecha}${materiaId ? `?materiaId=${materiaId}` : ""}`
      ),
    enabled: !!colegioId,
  })

  const resumenKey = gradoId ? `/${colegioId}/asistencias/resumen/${gradoId}?mes=${currentMes()}` : null
  const { data: resumen } = useQuery<{ mes: string; detalle: ResumenItem[] }>({
    queryKey: ["asistencias-resumen", colegioId, gradoId],
    queryFn: () => apiGet(`/${colegioId}/asistencias/resumen/${gradoId}?mes=${currentMes()}`),
    enabled: !!resumenKey,
  })

  const registroSeleccionado = useMemo(() => existente || {}, [existente])

  const saveMutation = useMutation({
    mutationFn: () =>
      apiPost(`/${colegioId}/asistencias`, {
        fecha,
        materiaId: materiaId || null,
        alumnos: (alumnos ?? []).map((a) => ({
          alumnoId: a.id,
          estado: registros[a.id] || registroSeleccionado[a.id] || "PRESENTE",
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asistencias"] })
      queryClient.invalidateQueries({ queryKey: ["asistencias-resumen"] })
      queryClient.invalidateQueries({ queryKey: ["alumnos-grado"] })
    },
  })

  const getEstado = (alumnoId: string): EstadoAsistencia =>
    registros[alumnoId] || (registroSeleccionado[alumnoId] as EstadoAsistencia) || "PRESENTE"

  const setEstado = (alumnoId: string, estado: EstadoAsistencia) => {
    setRegistros((prev) => ({ ...prev, [alumnoId]: estado }))
  }

  const marcarTodos = (estado: EstadoAsistencia) => {
    const nuevo: Record<string, EstadoAsistencia> = {}
    for (const a of alumnos ?? []) nuevo[a.id] = estado
    setRegistros(nuevo)
  }

  const conteo = (() => {
    const c: Record<EstadoAsistencia, number> = {
      PRESENTE: 0,
      TARDE: 0,
      AUSENTE: 0,
      EXCUSA: 0,
    }
    for (const a of alumnos ?? []) c[getEstado(a.id)]++
    return c
  })()

  const fechaLabel = new Date(fecha + "T12:00:00").toLocaleDateString("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
        <p className="text-sm text-gray-500">
          Registro de asistencia por clase y control de ausencias
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Fecha</label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value)
                setRegistros({})
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Grado</label>
            <select
              value={gradoId}
              onChange={(e) => {
                setGradoId(e.target.value)
                setRegistros({})
              }}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Selecciona un grado</option>
              {(grados ?? []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre} ({g._count.alumnos} alumnos)
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Materia (opcional)
            </label>
            <select
              value={materiaId}
              onChange={(e) => {
                setMateriaId(e.target.value)
                setRegistros({})
              }}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Asistencia general del dia</option>
              {(materias ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <p className="capitalize">{fechaLabel}</p>
              <p className="mt-1 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Los ausentes reciben aviso por correo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!gradoId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarCheck className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              Selecciona un grado para registrar la asistencia
            </p>
          </CardContent>
        </Card>
      ) : isLoading || cargandoExistente ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (alumnos ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No hay alumnos en este grado</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Alumnos del grado</CardTitle>
                <CardDescription>
                  {alumnos?.length} alumnos · {Object.keys(registroSeleccionado).length > 0 ? "registro cargado" : "sin registro previo"}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => marcarTodos("PRESENTE")}>
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Todos presentes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => marcarTodos("AUSENTE")}
                >
                  Todos ausentes
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 pr-4 font-medium text-gray-500">Codigo</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Alumno</th>
                    <th className="pb-3 font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(alumnos ?? []).map((alumno) => (
                    <tr key={alumno.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 text-gray-500">{alumno.codigo}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {alumno.nombre} {alumno.apellido}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          {ESTADOS.map((estado) => {
                            const active = getEstado(alumno.id) === estado
                            return (
                              <button
                                key={estado}
                                onClick={() => setEstado(alumno.id, estado)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                  active
                                    ? ESTADO_STYLE[estado]
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                              >
                                {estado === "PRESENTE"
                                  ? "Presente"
                                  : estado === "TARDE"
                                  ? "Tarde"
                                  : estado === "AUSENTE"
                                  ? "Ausente"
                                  : "Excusa"}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">{conteo.PRESENTE} presentes</Badge>
                <Badge variant="warning">{conteo.TARDE} tardes</Badge>
                <Badge variant="destructive">{conteo.AUSENTE} ausentes</Badge>
                <Badge variant="secondary">{conteo.EXCUSA} excusas</Badge>
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Asistencia
              </Button>
            </div>
            {saveMutation.isSuccess && (saveMutation.data as { emailAusenciasEnviados?: number } | undefined)?.emailAusenciasEnviados
              ? (
                  <p className="mt-2 text-xs text-green-700">
                    Se envio aviso de ausencia por correo a{" "}
                    {(saveMutation.data as { emailAusenciasEnviados?: number }).emailAusenciasEnviados}{" "}
                    responsable(s).
                  </p>
                )
              : null}
          </CardContent>
        </Card>
      )}

      {gradoId && resumen && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen del mes ({resumen.mes})</CardTitle>
            <CardDescription>Porcentaje de asistencia por alumno</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 pr-4 font-medium text-gray-500">Codigo</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Alumno</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">P</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">T</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">A</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">E</th>
                    <th className="pb-3 font-medium text-gray-500">Asistencia</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.detalle.map((d) => (
                    <tr key={d.alumnoId} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 text-gray-500">{d.codigo}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{d.alumno}</td>
                      <td className="py-3 pr-4 text-green-700">{d.presentes}</td>
                      <td className="py-3 pr-4 text-yellow-700">{d.tardes}</td>
                      <td className="py-3 pr-4 text-red-700">{d.ausentes}</td>
                      <td className="py-3 pr-4 text-blue-700">{d.excusas}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-gray-100">
                            <div
                              className={`h-2 rounded-full ${
                                d.porcientoAsistencia >= 90
                                  ? "bg-green-500"
                                  : d.porcientoAsistencia >= 70
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(d.porcientoAsistencia, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {d.porcientoAsistencia}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
