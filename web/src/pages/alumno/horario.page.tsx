import { useQuery } from "@tanstack/react-query"
import { Clock, Loader2, CalendarX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet } from "@/lib/api"

interface HorarioItem {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  aula: string | null
  materia: { nombre: string } | null
}

interface GradoDetalle {
  id: string
  nombre: string
  horarios: HorarioItem[]
}

const DIAS = ["", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]

export default function HorarioPage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery<GradoDetalle>({
    queryKey: ["mi-horario", user?.colegioId, user?.gradoId],
    queryFn: () => apiGet<GradoDetalle>(`/${user?.colegioId}/grados/${user?.gradoId}`),
    enabled: !!user?.colegioId && !!user?.gradoId,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Horario</h1>
        <p className="text-sm text-gray-500">
          {data?.nombre ? `Horario de ${data.nombre}` : "Horario de clases semanal"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : !user?.gradoId || !data ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarX className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              {user?.gradoId
                ? "No hay horario configurado para tu grado"
                : "Tu cuenta no tiene un grado asignado"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((dia) => {
            const clases = (data.horarios ?? []).filter((h) => h.diaSemana === dia)
            return (
              <Card key={dia}>
                <CardHeader className="border-b border-gray-100 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-primary" />
                    {DIAS[dia]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {clases.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin clases</p>
                  ) : (
                    <div className="space-y-3">
                      {clases.map((clase) => (
                        <div key={clase.id} className="rounded-lg border border-gray-100 p-3">
                          <p className="text-sm font-medium text-gray-900">
                            {clase.materia?.nombre ?? "Materia"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {clase.horaInicio} - {clase.horaFin}
                          </p>
                          {clase.aula && (
                            <Badge variant="secondary" className="mt-2 text-[10px]">
                              {clase.aula}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
