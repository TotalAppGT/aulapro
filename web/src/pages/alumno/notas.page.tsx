import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FileText, Loader2, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet } from "@/lib/api"

interface MateriaNota {
  materia: { id: string; nombre: string }
  notas: { tipo: string; nota: number }[]
  promedio: number
}

interface NotasAlumno {
  alumnoId: string
  bimestre: number
  materias: MateriaNota[]
}

export default function NotasPage() {
  const user = useAuthStore((s) => s.user)
  const [bimestre, setBimestre] = useState(1)

  const { data, isLoading } = useQuery<NotasAlumno>({
    queryKey: ["notas-alumno", user?.id, bimestre],
    queryFn: () =>
      apiGet<NotasAlumno>(`/${user?.colegioId}/calificaciones/alumno/${user?.id}/${bimestre}`),
    enabled: !!user?.colegioId && !!user?.id,
  })

  const notaColor = (n: number) =>
    n >= 90 ? "text-green-600" : n >= 70 ? "text-yellow-600" : "text-red-600"

  const notaBg = (n: number) =>
    n >= 90 ? "bg-green-50" : n >= 70 ? "bg-yellow-50" : "bg-red-50"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Notas</h1>
          <p className="text-sm text-gray-500">Calificaciones por materia</p>
        </div>
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

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (data?.materias ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No hay notas registradas para este bimestre
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Notas del Bimestre {bimestre}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.materias ?? []).map((m) => (
                <div
                  key={m.materia.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{m.materia.nombre}</p>
                    <div className="mt-1.5 flex gap-1.5">
                      {m.notas.map((n, i) => (
                        <Badge key={i} variant="secondary">
                          {n.tipo}: {n.nota}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Promedio</p>
                      <p className={`text-lg font-bold ${notaColor(m.promedio)}`}>
                        {m.promedio.toFixed(1)}
                      </p>
                    </div>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${notaBg(
                        m.promedio
                      )} ${notaColor(m.promedio)}`}
                    >
                      {Math.round(m.promedio)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
