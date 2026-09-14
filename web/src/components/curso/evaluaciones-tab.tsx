import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ClipboardCheck,
  Loader2,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  Award,
  Eye,
  ArrowLeft,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiGet, apiPost, apiDelete } from "@/lib/api"

interface Evaluacion {
  id: string
  titulo: string
  descripcion: string | null
  tipo: string
  puntajeTotal: number
  intentosMax: number
  publicado: boolean
  createdAt: string
  _count?: { preguntas: number; intentos: number }
  misIntentos?: number
  miMejorNota?: number | null
}

interface Pregunta {
  id: string
  orden: number
  enunciado: string
  tipo: string
  opciones: string[]
  puntaje: number
  respuestaCorrecta?: string
}

interface EvaluacionDetalle {
  id: string
  titulo: string
  descripcion: string | null
  tipo: string
  puntajeTotal: number
  intentosMax: number
  preguntas: Pregunta[]
}

interface Resultado {
  id: string
  nota: number | null
  usuario: { id: string; nombre: string; email: string }
}

interface PreguntaForm {
  enunciado: string
  tipo: "OPCION_MULTIPLE" | "VERDADERO_FALSO" | "RESPUESTA_CORTA"
  opcionesTexto: string
  respuestaCorrecta: string
  puntaje: number
}

const TIPO_LABEL: Record<string, string> = {
  QUIZ: "Quiz",
  EXAMEN: "Examen",
  PRACTICA: "Práctica",
}

function preguntaVacia(): PreguntaForm {
  return {
    enunciado: "",
    tipo: "OPCION_MULTIPLE",
    opcionesTexto: "",
    respuestaCorrecta: "",
    puntaje: 1,
  }
}

export function EvaluacionesTab({
  colegioId,
  cursoId,
  puedeEditar,
}: {
  colegioId: string
  cursoId: string
  puedeEditar: boolean
}) {
  const queryClient = useQueryClient()
  const [vista, setVista] = useState<"lista" | "crear">("lista")
  const [tomando, setTomando] = useState<EvaluacionDetalle | null>(null)
  const [resultados, setResultados] = useState<{ ev: Evaluacion; items: Resultado[] } | null>(null)

  const { data: evaluaciones, isLoading } = useQuery<Evaluacion[]>({
    queryKey: ["evaluaciones", cursoId],
    queryFn: () => apiGet<Evaluacion[]>(`/${colegioId}/evaluaciones?cursoId=${cursoId}`),
  })

  const eliminar = useMutation({
    mutationFn: (id: string) => apiDelete(`/${colegioId}/evaluaciones/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluaciones", cursoId] }),
  })

  if (tomando) {
    return (
      <TomarEvaluacion
        colegioId={colegioId}
        evaluacion={tomando}
        onSalir={() => {
          setTomando(null)
          queryClient.invalidateQueries({ queryKey: ["evaluaciones", cursoId] })
        }}
      />
    )
  }

  if (resultados) {
    return (
      <ResultadosEvaluacion
        evaluacion={resultados.ev}
        items={resultados.items}
        onSalir={() => setResultados(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {puedeEditar && vista === "lista" && (
        <div className="flex justify-end">
          <Button onClick={() => setVista("crear")}>
            <Plus className="mr-2 h-4 w-4" /> Nueva evaluación
          </Button>
        </div>
      )}

      {puedeEditar && vista === "crear" && (
        <CrearEvaluacion
          colegioId={colegioId}
          cursoId={cursoId}
          onCancelar={() => setVista("lista")}
          onCreada={() => {
            setVista("lista")
            queryClient.invalidateQueries({ queryKey: ["evaluaciones", cursoId] })
          }}
        />
      )}

      {vista === "lista" &&
        (isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : (evaluaciones ?? []).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-gray-500">
              No hay evaluaciones todavía
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {(evaluaciones ?? []).map((ev) => (
              <Card key={ev.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                      <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ev.titulo}</p>
                      <p className="text-xs text-gray-500">
                        {TIPO_LABEL[ev.tipo] ?? ev.tipo} · {ev._count?.preguntas ?? 0} preguntas ·{" "}
                        {ev.puntajeTotal} pts
                        {!puedeEditar && ev.miMejorNota != null && ` · Tu nota: ${ev.miMejorNota}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {puedeEditar ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const items = await apiGet<Resultado[]>(
                              `/${colegioId}/evaluaciones/${ev.id}/resultados`
                            )
                            setResultados({ ev, items })
                          }}
                        >
                          <Eye className="mr-1 h-3 w-3" /> Resultados
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => eliminar.mutate(ev.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={async () => {
                          const detalle = await apiGet<EvaluacionDetalle>(
                            `/${colegioId}/evaluaciones/${ev.id}`
                          )
                          setTomando(detalle)
                        }}
                      >
                        <Play className="mr-1 h-3 w-3" /> Resolver
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
    </div>
  )
}

function CrearEvaluacion({
  colegioId,
  cursoId,
  onCancelar,
  onCreada,
}: {
  colegioId: string
  cursoId: string
  onCancelar: () => void
  onCreada: () => void
}) {
  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState<"QUIZ" | "EXAMEN" | "PRACTICA">("QUIZ")
  const [intentosMax, setIntentosMax] = useState(1)
  const [preguntas, setPreguntas] = useState<PreguntaForm[]>([preguntaVacia()])
  const [error, setError] = useState("")

  const guardar = useMutation({
    mutationFn: () =>
      apiPost(`/${colegioId}/evaluaciones`, {
        cursoId,
        titulo,
        tipo,
        intentosMax,
        preguntas: preguntas.map((p) => ({
          enunciado: p.enunciado,
          tipo: p.tipo,
          opciones:
            p.tipo === "VERDADERO_FALSO"
              ? ["Verdadero", "Falso"]
              : p.tipo === "RESPUESTA_CORTA"
              ? []
              : p.opcionesTexto
                  .split("\n")
                  .map((o) => o.trim())
                  .filter(Boolean),
          respuestaCorrecta: p.respuestaCorrecta,
          puntaje: p.puntaje,
        })),
      }),
    onSuccess: onCreada,
    onError: (e) => setError(e instanceof Error ? e.message : "Error al guardar"),
  })

  const actualizar = (i: number, patch: Partial<PreguntaForm>) =>
    setPreguntas((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nueva evaluación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Título de la evaluación"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "QUIZ" | "EXAMEN" | "PRACTICA")}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="QUIZ">Quiz</option>
            <option value="EXAMEN">Examen</option>
            <option value="PRACTICA">Práctica</option>
          </select>
          <Input
            type="number"
            min={1}
            max={10}
            value={intentosMax}
            onChange={(e) => setIntentosMax(Number(e.target.value))}
          />
        </div>

        <div className="space-y-3">
          {preguntas.map((p, i) => (
            <div key={i} className="rounded-md border border-gray-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Pregunta {i + 1}</span>
                {preguntas.length > 1 && (
                  <button
                    onClick={() => setPreguntas((ps) => ps.filter((_, idx) => idx !== i))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Input
                placeholder="Enunciado de la pregunta"
                value={p.enunciado}
                onChange={(e) => actualizar(i, { enunciado: e.target.value })}
              />
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <select
                  value={p.tipo}
                  onChange={(e) =>
                    actualizar(i, {
                      tipo: e.target.value as PreguntaForm["tipo"],
                      respuestaCorrecta: "",
                    })
                  }
                  className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="OPCION_MULTIPLE">Opción múltiple</option>
                  <option value="VERDADERO_FALSO">Verdadero / Falso</option>
                  <option value="RESPUESTA_CORTA">Respuesta corta</option>
                </select>
                <Input
                  type="number"
                  min={0.1}
                  step={0.5}
                  placeholder="Puntaje"
                  value={p.puntaje}
                  onChange={(e) => actualizar(i, { puntaje: Number(e.target.value) })}
                />
                {p.tipo === "VERDADERO_FALSO" ? (
                  <select
                    value={p.respuestaCorrecta}
                    onChange={(e) => actualizar(i, { respuestaCorrecta: e.target.value })}
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                  >
                    <option value="">Respuesta correcta</option>
                    <option value="Verdadero">Verdadero</option>
                    <option value="Falso">Falso</option>
                  </select>
                ) : (
                  <Input
                    placeholder="Respuesta correcta"
                    value={p.respuestaCorrecta}
                    onChange={(e) => actualizar(i, { respuestaCorrecta: e.target.value })}
                  />
                )}
              </div>
              {p.tipo === "OPCION_MULTIPLE" && (
                <textarea
                  className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                  rows={3}
                  placeholder="Opciones, una por línea"
                  value={p.opcionesTexto}
                  onChange={(e) => actualizar(i, { opcionesTexto: e.target.value })}
                />
              )}
            </div>
          ))}
          <Button variant="outline" onClick={() => setPreguntas((ps) => [...ps, preguntaVacia()])}>
            <Plus className="mr-2 h-4 w-4" /> Agregar pregunta
          </Button>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setError("")
              if (titulo.trim().length < 2) return setError("Escribe un título")
              const valida = preguntas.every(
                (p) => p.enunciado.trim() && p.respuestaCorrecta.trim()
              )
              if (!valida) return setError("Completa el enunciado y la respuesta correcta de cada pregunta")
              guardar.mutate()
            }}
            disabled={guardar.isPending}
          >
            {guardar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar evaluación
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TomarEvaluacion({
  colegioId,
  evaluacion,
  onSalir,
}: {
  colegioId: string
  evaluacion: EvaluacionDetalle
  onSalir: () => void
}) {
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  const [resultado, setResultado] = useState<{
    nota: number
    detalle: Array<{ preguntaId: string; correcta: boolean; respuestaCorrecta: string }>
  } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")

  const enviar = async () => {
    setError("")
    try {
      setEnviando(true)
      const intento = await apiPost<{ id: string }>(
        `/${colegioId}/evaluaciones/${evaluacion.id}/intentos`,
        {}
      )
      const res = await apiPost<{
        nota: number
        detalle: Array<{ preguntaId: string; correcta: boolean; respuestaCorrecta: string }>
      }>(`/${colegioId}/evaluaciones/intentos/${intento.id}/responder`, { respuestas })
      setResultado(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar")
    } finally {
      setEnviando(false)
    }
  }

  if (resultado) {
    const correctas = resultado.detalle.filter((d) => d.correcta).length
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-5 w-5 text-yellow-500" /> Resultado: {resultado.nota} /{" "}
            {evaluacion.puntajeTotal}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Acertaste {correctas} de {resultado.detalle.length} preguntas.
          </p>
          {evaluacion.preguntas.map((p) => {
            const d = resultado.detalle.find((x) => x.preguntaId === p.id)
            return (
              <div key={p.id} className="rounded-md border border-gray-200 p-3">
                <div className="flex items-start gap-2">
                  {d?.correcta ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm text-gray-800">{p.enunciado}</p>
                    <p className="text-xs text-gray-500">
                      Tu respuesta: {respuestas[p.id] || "—"}
                      {!d?.correcta && ` · Correcta: ${d?.respuestaCorrecta}`}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div className="flex justify-end">
            <Button onClick={onSalir}>Volver a evaluaciones</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{evaluacion.titulo}</CardTitle>
          <Button size="sm" variant="ghost" onClick={onSalir}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {evaluacion.preguntas.map((p, i) => (
          <div key={p.id} className="rounded-md border border-gray-200 p-3">
            <p className="text-sm font-medium text-gray-800">
              {i + 1}. {p.enunciado}
            </p>
            <div className="mt-2 space-y-1">
              {p.tipo === "RESPUESTA_CORTA" ? (
                <Input
                  placeholder="Tu respuesta"
                  value={respuestas[p.id] ?? ""}
                  onChange={(e) => setRespuestas((r) => ({ ...r, [p.id]: e.target.value }))}
                />
              ) : (
                (p.tipo === "VERDADERO_FALSO" ? ["Verdadero", "Falso"] : p.opciones).map((op) => (
                  <label key={op} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name={p.id}
                      value={op}
                      checked={respuestas[p.id] === op}
                      onChange={() => setRespuestas((r) => ({ ...r, [p.id]: op }))}
                    />
                    {op}
                  </label>
                ))
              )}
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button onClick={enviar} disabled={enviando}>
            {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar respuestas
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ResultadosEvaluacion({
  evaluacion,
  items,
  onSalir,
}: {
  evaluacion: Evaluacion
  items: Resultado[]
  onSalir: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Resultados · {evaluacion.titulo}</CardTitle>
          <Button size="sm" variant="ghost" onClick={onSalir}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Aún nadie ha resuelto esta evaluación
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500">
                <th className="pb-2">Estudiante</th>
                <th className="pb-2">Correo</th>
                <th className="pb-2 text-right">Nota</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 text-sm">
                  <td className="py-2 font-medium text-gray-900">{r.usuario.nombre}</td>
                  <td className="py-2 text-gray-600">{r.usuario.email}</td>
                  <td className="py-2 text-right">
                    <Badge variant={r.nota != null && r.nota >= 60 ? "success" : "destructive"}>
                      {r.nota ?? "—"} / {evaluacion.puntajeTotal}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
