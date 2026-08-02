import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Megaphone, Plus, Loader2, MessageCircle, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"
import { formatDateShort } from "@/lib/utils"

interface Anuncio {
  id: string
  titulo: string
  contenido: string
  tipo: string
  enviarWhatsapp: boolean
  enviarEmail: boolean
  grado: { nombre: string } | null
  creador: { nombre: string }
  createdAt: string
}

const tipoColor: Record<string, "default" | "secondary" | "destructive" | "warning"> = {
  GENERAL: "secondary",
  GRADO: "default",
  SECCION: "warning",
  URGENTE: "destructive",
}

export default function AnunciosPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titulo: "",
    contenido: "",
    tipo: "GENERAL",
    enviarWhatsapp: false,
    enviarEmail: false,
  })

  const { data: anuncios, isLoading } = useQuery<Anuncio[]>({
    queryKey: ["anuncios", user?.colegioId],
    queryFn: () => apiGet<Anuncio[]>(`/${user?.colegioId}/anuncios`),
    enabled: !!user?.colegioId,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost(`/${user?.colegioId}/anuncios`, {
        titulo: form.titulo,
        contenido: form.contenido,
        tipo: form.tipo,
        enviarWhatsapp: form.enviarWhatsapp,
        enviarEmail: form.enviarEmail,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anuncios"] })
      setShowForm(false)
      setForm({
        titulo: "",
        contenido: "",
        tipo: "GENERAL",
        enviarWhatsapp: false,
        enviarEmail: false,
      })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anuncios</h1>
          <p className="text-sm text-gray-500">
            Comunica avisos a padres, profesores y alumnos
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Anuncio
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Anuncio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Titulo</label>
                <Input
                  placeholder="Titulo del anuncio"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contenido</label>
                <textarea
                  placeholder="Contenido del anuncio..."
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="GENERAL">General</option>
                  <option value="GRADO">Por Grado</option>
                  <option value="SECCION">Por Seccion</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.enviarWhatsapp}
                    onChange={(e) =>
                      setForm({ ...form, enviarWhatsapp: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  Enviar por WhatsApp
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.enviarEmail}
                    onChange={(e) =>
                      setForm({ ...form, enviarEmail: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Mail className="h-4 w-4 text-blue-500" />
                  Enviar por Email
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.titulo || !form.contenido}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (anuncios ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No hay anuncios publicados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(anuncios ?? []).map((anuncio) => (
            <Card key={anuncio.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{anuncio.titulo}</h3>
                      <Badge variant={tipoColor[anuncio.tipo] ?? "secondary"}>
                        {anuncio.tipo}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{anuncio.contenido}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        Por {anuncio.creador.nombre} - {formatDateShort(anuncio.createdAt)}
                      </span>
                      {anuncio.grado && <span>Para: {anuncio.grado.nombre}</span>}
                      {anuncio.enviarWhatsapp && (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </span>
                      )}
                      {anuncio.enviarEmail && (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <Mail className="h-3.5 w-3.5" /> Email
                        </span>
                      )}
                    </div>
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
