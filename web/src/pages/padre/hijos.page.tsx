import { useQuery } from "@tanstack/react-query"
import { Users, Loader2, GraduationCap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet } from "@/lib/api"

interface Alumno {
  id: string
  nombre: string
  apellido: string | null
  codigo: string
  grado: { nombre: string } | null
  responsableId: string | null
}

export default function HijosPage() {
  const user = useAuthStore((s) => s.user)

  const { data: alumnos, isLoading } = useQuery<Alumno[]>({
    queryKey: ["alumnos", user?.colegioId],
    queryFn: () => apiGet<Alumno[]>(`/${user?.colegioId}/alumnos`),
    enabled: !!user?.colegioId,
    select: (data) =>
      data.filter((a) => a.responsableId === user?.id),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Hijos</h1>
        <p className="text-sm text-gray-500">
          Los alumnos vinculados a tu cuenta
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (alumnos ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No tienes hijos vinculados a esta cuenta
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(alumnos ?? []).map((alumno) => (
            <Card key={alumno.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {alumno.nombre} {alumno.apellido}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{alumno.codigo}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {alumno.grado ? (
                    <Badge variant="secondary">{alumno.grado.nombre}</Badge>
                  ) : (
                    <Badge variant="outline">Sin grado</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
