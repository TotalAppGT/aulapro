import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BookOpen, Plus, Loader2, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"
import { formatDateShort } from "@/lib/utils"

interface Grado {
  id: string
  nombre: string
}

interface Tarea {
  id: string
  titulo: string
  materia: string
  descripcion: string | null
  fechaEntrega: string
  creador: { id: string; nombre: string }
  _count: { entregas: number }
}

export default function TareasPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [gradoId, setGradoId] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    materia: "",
    titulo: "",
    descripcion: "",
    fechaEntrega: "",
  })

  const { data: grados } = useQuery<Grado[]>({
    queryKey: ["grados", user?.colegioId],
    queryFn: () => apiGet<Grado[]>(`/${user?.colegioId}/grados`),
    enabled: !!user?.colegioId,
  })

  const { data: tareas, isLoading } = useQuery<Tarea[]>({
    queryKey: ["tareas", user?.colegioId, gradoId],
    queryFn: () => apiGet<Tarea[]>(`/${user?.colegioId}/tareas/grado/${gradoId}`),
    enabled: !!user?.colegioId && !!gradoId,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost(`/${user?.colegioId}/tareas`, {
        gradoId,
        materia: form.materia,
        titulo: form.titulo,
        descripcion: form.descripcion || undefined,
        fechaEntrega: form.fechaEntrega,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] })
      setShowForm(false)
      setForm({ materia: "", titulo: "", descripcion: "", fechaEntrega: "" })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
          <p className="text-sm text-gray-500">Asigna tareas por grado</p>
        </div>
        <div className="flex gap-2">
          <select
            value={gradoId}
            onChange={(e) => setGradoId(e.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Selecciona un grado</option>
            {(grados ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
          <Button disabled={!gradoId} onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {showForm && gradoId && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Tarea</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Materia</label>
                <Input
                  placeholder="Matematicas"
                  value={form.materia}
                  onChange={(e) => setForm({ ...form, materia: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha de Entrega</label>
                <Input
                  type="date"
                  value={form.fechaEntrega}
                  onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Titulo</label>
                <Input
                  placeholder="Titulo de la tarea"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Descripcion</label>
                <textarea
                  placeholder="Instrucciones de la tarea..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.materia || !form.titulo || !form.fechaEntrega}
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

      {!gradoId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              Selecciona un grado para ver sus tareas
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (tareas ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No hay tareas para este grado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(tareas ?? []).map((tarea) => (
            <Card key={tarea.id}>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{tarea.titulo}</h3>
                    <Badge variant="secondary">{tarea.materia}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{tarea.descripcion}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Entrega: {formatDateShort(tarea.fechaEntrega)}
                    </span>
                    <span>Por: {tarea.creador.nombre}</span>
                    <span>{tarea._count.entregas} entregas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
