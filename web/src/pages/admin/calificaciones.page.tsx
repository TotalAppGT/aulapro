import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ClipboardCheck, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet } from "@/lib/api"

interface Grado {
  id: string
  nombre: string
}

interface Materia {
  id: string
  nombre: string
}

interface AlumnoNota {
  alumno: { id: string; nombre: string; apellido: string | null }
  notas: { tipo: string; nota: number }[]
  promedio: number | null
}

interface NotasGrado {
  gradoId: string
  materiaId: string
  bimestre: number
  alumnos: AlumnoNota[]
}

export default function CalificacionesPage() {
  const user = useAuthStore((s) => s.user)
  const [gradoId, setGradoId] = useState("")
  const [materiaId, setMateriaId] = useState("")
  const [bimestre, setBimestre] = useState(1)

  const { data: grados } = useQuery<Grado[]>({
    queryKey: ["grados", user?.colegioId],
    queryFn: () => apiGet<Grado[]>(`/${user?.colegioId}/grados`),
    enabled: !!user?.colegioId,
  })

  const { data: materias } = useQuery<Materia[]>({
    queryKey: ["materias", user?.colegioId],
    queryFn: () =>
      apiGet<{ nombre: string; id: string }[]>(`/${user?.colegioId}/materias`).catch(
        () => []
      ),
    enabled: !!user?.colegioId,
  })

  const { data: notas, isLoading } = useQuery<NotasGrado>({
    queryKey: ["notas", user?.colegioId, gradoId, materiaId, bimestre],
    queryFn: () =>
      apiGet<NotasGrado>(
        `/${user?.colegioId}/calificaciones/grado/${gradoId}/${materiaId}/${bimestre}`
      ),
    enabled: !!user?.colegioId && !!gradoId && !!materiaId,
  })

  const promedioColor = (promedio: number | null) => {
    if (promedio === null) return "text-gray-400"
    if (promedio >= 70) return "text-green-600"
    if (promedio >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calificaciones</h1>
        <p className="text-sm text-gray-500">
          Consulta las notas de los alumnos por grado y materia
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={gradoId}
          onChange={(e) => setGradoId(e.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        >
          <option value="">Grado</option>
          {(grados ?? []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre}
            </option>
          ))}
        </select>
        <select
          value={materiaId}
          onChange={(e) => setMateriaId(e.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        >
          <option value="">Materia</option>
          {(materias ?? []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
        <select
          value={bimestre}
          onChange={(e) => setBimestre(Number(e.target.value))}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        >
          {[1, 2, 3, 4].map((b) => (
            <option key={b} value={b}>
              Bimestre {b}
            </option>
          ))}
        </select>
      </div>

      {!gradoId || !materiaId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardCheck className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              Selecciona un grado y una materia para ver las notas
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Notas - Bimestre {bimestre}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 pr-4 font-medium text-gray-500">Alumno</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Notas</th>
                    <th className="pb-3 font-medium text-gray-500">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {(notas?.alumnos ?? []).map((row) => (
                    <tr key={row.alumno.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {row.alumno.nombre} {row.alumno.apellido}
                      </td>
                      <td className="py-3 pr-4">
                        {row.notas.length === 0 ? (
                          <span className="text-gray-400">Sin notas</span>
                        ) : (
                          <div className="flex gap-1.5">
                            {row.notas.map((n, i) => (
                              <Badge key={i} variant="secondary">
                                {n.tipo}: {n.nota}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className={`py-3 font-semibold ${promedioColor(row.promedio)}`}>
                        {row.promedio !== null ? row.promedio.toFixed(1) : "-"}
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
