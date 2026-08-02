import { useQuery } from "@tanstack/react-query"
import { BookOpenCheck, Loader2, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet } from "@/lib/api"

interface Grado {
  id: string
  nombre: string
  nivel: string | null
  _count: { alumnos: number }
}

export default function CursosPage() {
  const user = useAuthStore((s) => s.user)

  const { data: grados, isLoading } = useQuery<Grado[]>({
    queryKey: ["grados", user?.colegioId],
    queryFn: () => apiGet<Grado[]>(`/${user?.colegioId}/grados`),
    enabled: !!user?.colegioId,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Cursos</h1>
        <p className="text-sm text-gray-500">Grados asignados a tu catedra</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (grados ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpenCheck className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No tienes cursos asignados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(grados ?? []).map((grado) => (
            <Card key={grado.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {grado.nombre}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {grado.nivel || "Sin nivel"}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                    <BookOpenCheck className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 border-t border-gray-100 pt-4 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-gray-400" />
                  {grado._count.alumnos} alumnos
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
