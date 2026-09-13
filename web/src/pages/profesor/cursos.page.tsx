import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BookOpenCheck, Loader2, Users, Plus, FileText, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"

interface Curso {
  id: string
  nombre: string
  descripcion: string | null
  grado: { id: string; nombre: string }
  materia: { id: string; nombre: string } | null
  profesor: { id: string; nombre: string } | null
  _count: { materiales: number; posts: number; sesiones: number }
}

interface Grado {
  id: string
  nombre: string
}

interface Materia {
  id: string
  nombre: string
}

export default function CursosPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [gradoId, setGradoId] = useState("")
  const [materiaId, setMateriaId] = useState("")
  const [nombre, setNombre] = useState("")

  const { data: cursos, isLoading } = useQuery<Curso[]>({
    queryKey: ["cursos", user?.colegioId],
    queryFn: () => apiGet<Curso[]>(`/${user?.colegioId}/cursos`),
    enabled: !!user?.colegioId,
  })

  const { data: grados } = useQuery<Grado[]>({
    queryKey: ["grados", user?.colegioId],
    queryFn: () => apiGet<Grado[]>(`/${user?.colegioId}/grados`),
    enabled: !!user?.colegioId,
  })

  const { data: materias } = useQuery<Materia[]>({
    queryKey: ["materias", user?.colegioId],
    queryFn: () => apiGet<Materia[]>(`/${user?.colegioId}/materias`).catch(() => []),
    enabled: !!user?.colegioId,
  })

  const crear = useMutation({
    mutationFn: () =>
      apiPost(`/${user?.colegioId}/cursos`, {
        gradoId,
        materiaId: materiaId || null,
        nombre,
      }),
    onSuccess: () => {
      setShowForm(false)
      setGradoId("")
      setMateriaId("")
      setNombre("")
      queryClient.invalidateQueries({ queryKey: ["cursos"] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Cursos</h1>
          <p className="text-sm text-gray-500">Aulas virtuales por grado y materia</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo curso
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={gradoId}
                onChange={(e) => setGradoId(e.target.value)}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="">Selecciona grado</option>
                {(grados ?? []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
              <select
                value={materiaId}
                onChange={(e) => setMateriaId(e.target.value)}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="">Materia (opcional)</option>
                {(materias ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Nombre del curso"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => crear.mutate()}
                disabled={!gradoId || nombre.trim().length < 2 || crear.isPending}
              >
                {crear.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear curso
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (cursos ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpenCheck className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No tienes cursos todavía</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Crear el primero
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(cursos ?? []).map((curso) => (
            <Card
              key={curso.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/app/curso/${curso.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{curso.nombre}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {curso.grado.nombre}
                      {curso.materia ? ` · ${curso.materia.nombre}` : ""}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                    <BookOpenCheck className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                    {curso._count.materiales}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                    {curso._count.posts}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {curso.profesor?.nombre ?? "Sin prof."}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
