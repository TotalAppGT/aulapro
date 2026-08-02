import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ClipboardCheck, Loader2, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"

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
  alumnos: AlumnoNota[]
}

export default function CalificarPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [gradoId, setGradoId] = useState("")
  const [materiaId, setMateriaId] = useState("")
  const [bimestre, setBimestre] = useState(1)
  const [notas, setNotas] = useState<Record<string, string>>({})

  const { data: grados } = useQuery<Grado[]>({
    queryKey: ["grados", user?.colegioId],
    queryFn: () => apiGet<Grado[]>(`/${user?.colegioId}/grados`),
    enabled: !!user?.colegioId,
  })

  const { data: materias } = useQuery<Materia[]>({
    queryKey: ["materias", user?.colegioId],
    queryFn: () =>
      apiGet<Materia[]>(`/${user?.colegioId}/materias`).catch(() => []),
    enabled: !!user?.colegioId,
  })

  const { data: dataNotas, isLoading } = useQuery<NotasGrado>({
    queryKey: ["notas", user?.colegioId, gradoId, materiaId, bimestre],
    queryFn: () =>
      apiGet<NotasGrado>(
        `/${user?.colegioId}/calificaciones/grado/${gradoId}/${materiaId}/${bimestre}`
      ),
    enabled: !!user?.colegioId && !!gradoId && !!materiaId,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const [alumnoId, nota] of Object.entries(notas)) {
        if (nota === "") continue
        const value = parseFloat(nota)
        if (isNaN(value)) continue
        await apiPost(`/${user?.colegioId}/calificaciones`, {
          alumnoId,
          materiaId,
          bimestre,
          nota: value,
          tipo: "parcial",
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas"] })
      setNotas({})
    },
  })

  const alumnos = dataNotas?.alumnos ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calificar</h1>
        <p className="text-sm text-gray-500">
          Registra las notas de los alumnos por materia y bimestre
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
              Selecciona un grado y una materia para calificar
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
            <CardTitle>Registrar Notas - Bimestre {bimestre}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 pr-4 font-medium text-gray-500">Alumno</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">
                      Promedio Actual
                    </th>
                    <th className="pb-3 font-medium text-gray-500">Nota (0-100)</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((row) => (
                    <tr key={row.alumno.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {row.alumno.nombre} {row.alumno.apellido}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {row.promedio !== null ? row.promedio.toFixed(1) : "-"}
                      </td>
                      <td className="py-3">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Nota"
                          className="w-24"
                          value={notas[row.alumno.id] ?? ""}
                          onChange={(e) =>
                            setNotas({
                              ...notas,
                              [row.alumno.id]: e.target.value,
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || Object.keys(notas).length === 0}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Notas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
