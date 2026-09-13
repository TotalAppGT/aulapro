import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Loader2,
  Send,
  FileText,
  Link as LinkIcon,
  Video,
  Plus,
  Trash2,
  MessageSquare,
  ExternalLink,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost, apiDelete, apiUpload } from "@/lib/api"

interface Curso {
  id: string
  nombre: string
  descripcion: string | null
  grado: { id: string; nombre: string; nivel: string | null }
  materia: { id: string; nombre: string } | null
  profesor: { id: string; nombre: string } | null
}

interface Material {
  id: string
  titulo: string
  descripcion: string | null
  tipo: string
  key: string | null
  url: string | null
  signedUrl: string | null
  creador: { id: string; nombre: string }
  createdAt: string
}

interface Comentario {
  id: string
  contenido: string
  autor: { id: string; nombre: string; rol: string }
  createdAt: string
}

interface MuroPost {
  id: string
  contenido: string
  archivos: string[]
  autor: { id: string; nombre: string; rol: string }
  createdAt: string
  comentarios: Comentario[]
}

interface Sesion {
  id: string
  titulo: string
  descripcion: string | null
  fecha: string
  duracionMin: number
  proveedor: string
  url: string
  creador: { id: string; nombre: string }
}

const TABS = [
  { id: "muro", label: "Muro" },
  { id: "materiales", label: "Materiales" },
  { id: "en-vivo", label: "En vivo" },
] as const

type TabId = (typeof TABS)[number]["id"]

function fmtFecha(iso: string) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

export default function CursoDetallePage() {
  const { cursoId } = useParams<{ cursoId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabId>("muro")

  const puedeEditar = user?.rol === "PROFESOR" || user?.rol === "ADMIN_COLEGIO"

  const { data: curso, isLoading } = useQuery<Curso>({
    queryKey: ["curso", cursoId],
    queryFn: () => apiGet<Curso>(`/${user?.colegioId}/cursos/${cursoId}`),
    enabled: !!user?.colegioId && !!cursoId,
  })

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : !curso ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-gray-500">
            Curso no encontrado
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{curso.nombre}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <Badge variant="secondary">{curso.grado.nombre}</Badge>
              {curso.materia && <Badge variant="outline">{curso.materia.nombre}</Badge>}
              {curso.profesor && <span>Prof. {curso.profesor.nombre}</span>}
            </div>
            {curso.descripcion && (
              <p className="mt-2 text-sm text-gray-600">{curso.descripcion}</p>
            )}
          </div>

          <div className="flex gap-2 border-b border-gray-200">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "muro" && (
            <MuroTab colegioId={user!.colegioId} cursoId={curso.id} puedeEditar={puedeEditar} queryClient={queryClient} />
          )}
          {tab === "materiales" && (
            <MaterialesTab colegioId={user!.colegioId} cursoId={curso.id} puedeEditar={puedeEditar} queryClient={queryClient} />
          )}
          {tab === "en-vivo" && (
            <EnVivoTab colegioId={user!.colegioId} cursoId={curso.id} puedeEditar={puedeEditar} queryClient={queryClient} />
          )}
        </>
      )}
    </div>
  )
}

function MuroTab({
  colegioId,
  cursoId,
  puedeEditar,
  queryClient,
}: {
  colegioId: string
  cursoId: string
  puedeEditar: boolean
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const [contenido, setContenido] = useState("")
  const [comentarios, setComentarios] = useState<Record<string, string>>({})

  const { data: posts, isLoading } = useQuery<MuroPost[]>({
    queryKey: ["curso-muro", cursoId],
    queryFn: () => apiGet<MuroPost[]>(`/${colegioId}/cursos/${cursoId}/muro`),
  })

  const crearPost = useMutation({
    mutationFn: () =>
      apiPost(`/${colegioId}/cursos/${cursoId}/muro`, { contenido, archivos: [] }),
    onSuccess: () => {
      setContenido("")
      queryClient.invalidateQueries({ queryKey: ["curso-muro", cursoId] })
    },
  })

  const comentar = useMutation({
    mutationFn: ({ postId, texto }: { postId: string; texto: string }) =>
      apiPost(`/${colegioId}/cursos/${cursoId}/muro/${postId}/comentarios`, {
        contenido: texto,
      }),
    onSuccess: (_d, v) => {
      setComentarios((c) => ({ ...c, [v.postId]: "" }))
      queryClient.invalidateQueries({ queryKey: ["curso-muro", cursoId] })
    },
  })

  return (
    <div className="space-y-4">
      {puedeEditar && (
        <Card>
          <CardContent className="p-4">
            <textarea
              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-primary focus:outline-none"
              rows={3}
              placeholder="Publica un aviso, material o mensaje para el curso..."
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <Button
                onClick={() => crearPost.mutate()}
                disabled={!contenido.trim() || crearPost.isPending}
              >
                {crearPost.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (posts ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            Aún no hay publicaciones en el muro
          </CardContent>
        </Card>
      ) : (
        (posts ?? []).map((post) => (
          <Card key={post.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{post.autor.nombre}</p>
                  <p className="text-xs text-gray-500">{fmtFecha(post.createdAt)}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {post.autor.rol}
                </Badge>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                {post.contenido}
              </p>

              {post.comentarios.length > 0 && (
                <div className="mt-3 space-y-2 border-l-2 border-gray-100 pl-3">
                  {post.comentarios.map((c) => (
                    <div key={c.id}>
                      <p className="text-xs font-medium text-gray-700">
                        {c.autor.nombre}{" "}
                        <span className="font-normal text-gray-400">
                          · {fmtFecha(c.createdAt)}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">{c.contenido}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <input
                  className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  placeholder="Escribe un comentario..."
                  value={comentarios[post.id] ?? ""}
                  onChange={(e) =>
                    setComentarios((c) => ({ ...c, [post.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (comentarios[post.id] ?? "").trim()) {
                      comentar.mutate({ postId: post.id, texto: comentarios[post.id] })
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!(comentarios[post.id] ?? "").trim() || comentar.isPending}
                  onClick={() =>
                    comentar.mutate({ postId: post.id, texto: comentarios[post.id] })
                  }
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function MaterialesTab({
  colegioId,
  cursoId,
  puedeEditar,
  queryClient,
}: {
  colegioId: string
  cursoId: string
  puedeEditar: boolean
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const [titulo, setTitulo] = useState("")
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState("")

  const { data: materiales, isLoading } = useQuery<Material[]>({
    queryKey: ["curso-materiales", cursoId],
    queryFn: () => apiGet<Material[]>(`/${colegioId}/cursos/${cursoId}/materiales`),
  })

  const eliminar = useMutation({
    mutationFn: (id: string) => apiDelete(`/${colegioId}/cursos/materiales/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["curso-materiales", cursoId] }),
  })

  const handleAgregar = async () => {
    setError("")
    if (titulo.trim().length < 2) {
      setError("Escribe un título")
      return
    }
    try {
      setSubiendo(true)
      let key: string | null = null
      let tipo: "ARCHIVO" | "ENLACE" = "ENLACE"
      if (file) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await apiUpload<{ key: string }>(
          `/${colegioId}/uploads?folder=cursos`,
          fd
        )
        key = res.key
        tipo = "ARCHIVO"
      } else if (!url.trim()) {
        setError("Adjunta un archivo o pega un enlace")
        setSubiendo(false)
        return
      }
      await apiPost(`/${colegioId}/cursos/${cursoId}/materiales`, {
        titulo,
        tipo,
        key,
        url: key ? null : url,
      })
      setTitulo("")
      setUrl("")
      setFile(null)
      queryClient.invalidateQueries({ queryKey: ["curso-materiales", cursoId] })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="space-y-4">
      {puedeEditar && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agregar material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <Input
              placeholder="Título del material"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <Input
              placeholder="Enlace (opcional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm text-gray-600"
              />
              <Button onClick={handleAgregar} disabled={subiendo}>
                {subiendo ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Agregar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (materiales ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            No hay materiales todavía
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(materiales ?? []).map((m) => {
            const enlace = m.signedUrl || m.url || "#"
            const esArchivo = m.tipo === "ARCHIVO"
            return (
              <Card key={m.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                      {esArchivo ? (
                        <FileText className="h-5 w-5 text-primary" />
                      ) : (
                        <LinkIcon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.titulo}</p>
                      <p className="text-xs text-gray-500">
                        {esArchivo ? "Archivo" : "Enlace"} · {m.creador.nombre}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={enlace} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="mr-1 h-3 w-3" /> Abrir
                      </Button>
                    </a>
                    {puedeEditar && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => eliminar.mutate(m.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EnVivoTab({
  colegioId,
  cursoId,
  puedeEditar,
  queryClient,
}: {
  colegioId: string
  cursoId: string
  puedeEditar: boolean
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const [titulo, setTitulo] = useState("")
  const [fecha, setFecha] = useState("")
  const [proveedor, setProveedor] = useState<"JITSI" | "MEET" | "ZOOM" | "OTRO">("JITSI")
  const [url, setUrl] = useState("")
  const [embed, setEmbed] = useState<Sesion | null>(null)

  const { data: sesiones, isLoading } = useQuery<Sesion[]>({
    queryKey: ["curso-sesiones", cursoId],
    queryFn: () => apiGet<Sesion[]>(`/${colegioId}/cursos/${cursoId}/sesiones`),
  })

  const crear = useMutation({
    mutationFn: () =>
      apiPost(`/${colegioId}/cursos/${cursoId}/sesiones`, {
        titulo,
        fecha: fecha || new Date().toISOString(),
        proveedor,
        url: proveedor === "JITSI" ? null : url,
        duracionMin: 60,
      }),
    onSuccess: () => {
      setTitulo("")
      setFecha("")
      setUrl("")
      queryClient.invalidateQueries({ queryKey: ["curso-sesiones", cursoId] })
    },
  })

  const eliminar = useMutation({
    mutationFn: (id: string) => apiDelete(`/${colegioId}/cursos/sesiones/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["curso-sesiones", cursoId] }),
  })

  return (
    <div className="space-y-4">
      {puedeEditar && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Programar clase en vivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Título de la clase"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="datetime-local"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
              <select
                value={proveedor}
                onChange={(e) =>
                  setProveedor(e.target.value as "JITSI" | "MEET" | "ZOOM" | "OTRO")
                }
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="JITSI">Jitsi (sala automática, gratis)</option>
                <option value="MEET">Google Meet (pegar enlace)</option>
                <option value="ZOOM">Zoom (pegar enlace)</option>
                <option value="OTRO">Otro (pegar enlace)</option>
              </select>
            </div>
            {proveedor !== "JITSI" && (
              <Input
                placeholder="Pega el enlace de la reunión"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            )}
            {proveedor === "JITSI" && (
              <p className="text-xs text-gray-500">
                El sistema creará la sala automáticamente (no necesitas crear enlaces).
              </p>
            )}
            <div className="flex justify-end">
              <Button
                onClick={() => crear.mutate()}
                disabled={titulo.trim().length < 2 || crear.isPending}
              >
                {crear.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Video className="mr-2 h-4 w-4" />
                )}
                Programar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {embed && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{embed.titulo}</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setEmbed(null)}>
              Cerrar
            </Button>
          </CardHeader>
          <CardContent>
            <iframe
              src={embed.url}
              allow="camera; microphone; fullscreen; display-capture"
              className="h-[500px] w-full rounded-md border border-gray-200"
              title={embed.titulo}
            />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (sesiones ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            No hay clases en vivo programadas
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(sesiones ?? []).map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <Video className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.titulo}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" /> {fmtFecha(s.fecha)} · {s.proveedor}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.proveedor === "JITSI" ? (
                    <Button size="sm" onClick={() => setEmbed(s)}>
                      <Video className="mr-1 h-3 w-3" /> Entrar
                    </Button>
                  ) : (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      <Button size="sm">
                        <ExternalLink className="mr-1 h-3 w-3" /> Unirse
                      </Button>
                    </a>
                  )}
                  {puedeEditar && (
                    <Button size="sm" variant="ghost" onClick={() => eliminar.mutate(s.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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
