import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import jsQR from "jsqr"
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  Loader2,
  Camera,
  Keyboard,
  ListChecks,
  Save,
  CheckCheck,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"

interface Resultado {
  ok: boolean
  mensaje: string
  nombre?: string
  grado?: string
  estado?: string
  yaRegistrado?: boolean
}

interface Grado {
  id: string
  nombre: string
  _count?: { alumnos: number }
}

interface Alumno {
  id: string
  codigo: string
  nombre: string
  apellido: string | null
  grado: { id: string; nombre: string } | null
}

type EstadoAsistencia = "PRESENTE" | "TARDE" | "AUSENTE" | "EXCUSA"

const ESTADOS: EstadoAsistencia[] = ["PRESENTE", "TARDE", "AUSENTE", "EXCUSA"]
const ESTADO_STYLE: Record<EstadoAsistencia, string> = {
  PRESENTE: "bg-green-100 text-green-700",
  TARDE: "bg-yellow-100 text-yellow-700",
  AUSENTE: "bg-red-100 text-red-700",
  EXCUSA: "bg-blue-100 text-blue-700",
}
const ESTADO_LABEL: Record<EstadoAsistencia, string> = {
  PRESENTE: "Presente",
  TARDE: "Tarde",
  AUSENTE: "Ausente",
  EXCUSA: "Excusa",
}

function todayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export default function AsistenciaScanPage() {
  const user = useAuthStore((s) => s.user)
  const colegioId = user?.colegioId
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const runningRef = useRef(false)
  const lastScanRef = useRef<{ token: string; at: number }>({ token: "", at: 0 })

  const [tab, setTab] = useState<"scan" | "lista">("scan")
  const [manual, setManual] = useState("")
  const [camaraActiva, setCamaraActiva] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [historial, setHistorial] = useState<Resultado[]>([])

  // Checklist
  const [gradoId, setGradoId] = useState("")
  const [fecha, setFecha] = useState(todayStr())
  const [registros, setRegistros] = useState<Record<string, EstadoAsistencia>>({})

  const { data: grados } = useQuery<Grado[]>({
    queryKey: ["grados", colegioId],
    queryFn: () => apiGet<Grado[]>(`/${colegioId}/grados`),
    enabled: !!colegioId && tab === "lista",
  })

  const { data: alumnos } = useQuery<Alumno[]>({
    queryKey: ["alumnos-lista", colegioId],
    queryFn: () => apiGet<Alumno[]>(`/${colegioId}/alumnos`),
    enabled: !!colegioId && tab === "lista",
  })

  const alumnosGrado = useMemo(
    () => (alumnos ?? []).filter((a) => a.grado?.id === gradoId),
    [alumnos, gradoId],
  )

  const registrar = async (qrToken: string) => {
    const token = qrToken.trim()
    if (!token || enviando) return
    const now = Date.now()
    if (lastScanRef.current.token === token && now - lastScanRef.current.at < 2500) return
    lastScanRef.current = { token, at: now }

    setEnviando(true)
    try {
      const data = await apiPost<{
        verificado: boolean
        asistenciaRegistrada: boolean
        estadoAsistencia: string
        alumno: { nombre: string; grado: string }
      }>("/qr/verificar", { qrToken: token, registrarAsistencia: true })
      const r: Resultado = {
        ok: true,
        mensaje: data.asistenciaRegistrada ? "Asistencia registrada (Presente)" : "El alumno ya tenia registro hoy",
        nombre: data.alumno.nombre,
        grado: data.alumno.grado,
        estado: data.estadoAsistencia,
        yaRegistrado: !data.asistenciaRegistrada,
      }
      setResultado(r)
      setHistorial((h) => [r, ...h].slice(0, 12))
    } catch (err) {
      const r: Resultado = { ok: false, mensaje: (err as Error).message || "QR invalido" }
      setResultado(r)
      setHistorial((h) => [r, ...h].slice(0, 12))
    } finally {
      setEnviando(false)
      setManual("")
    }
  }

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCamaraActiva(true)
      runningRef.current = true
      requestAnimationFrame(loop)
    } catch {
      setCamaraActiva(false)
      setResultado({ ok: false, mensaje: "No se pudo abrir la camara. Usa la entrada manual o la lista." })
    }
  }

  const loop = () => {
    if (!runningRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" })
        if (code?.data) {
          const token = code.data.split("/").filter(Boolean).pop() || code.data
          void registrar(token)
        }
      }
    }
    if (runningRef.current) requestAnimationFrame(loop)
  }

  const detenerCamara = () => {
    runningRef.current = false
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCamaraActiva(false)
  }

  useEffect(() => () => detenerCamara(), [])

  const getEstado = (id: string): EstadoAsistencia => registros[id] || "PRESENTE"
  const marcarTodos = (estado: EstadoAsistencia) => {
    const nuevo: Record<string, EstadoAsistencia> = {}
    for (const a of alumnosGrado) nuevo[a.id] = estado
    setRegistros(nuevo)
  }

  const [guardandoLista, setGuardandoLista] = useState(false)
  const [listaOk, setListaOk] = useState<string | null>(null)

  const guardarLista = async () => {
    if (!colegioId || !gradoId || alumnosGrado.length === 0) return
    setGuardandoLista(true)
    setListaOk(null)
    try {
      const data = await apiPost<{ emailAusenciasEnviados?: number }>(`/${colegioId}/asistencias`, {
        fecha,
        materiaId: null,
        alumnos: alumnosGrado.map((a) => ({ alumnoId: a.id, estado: getEstado(a.id) })),
      })
      setListaOk(
        data.emailAusenciasEnviados
          ? `Guardado. Avisos de ausencia enviados: ${data.emailAusenciasEnviados}.`
          : "Asistencia guardada.",
      )
    } catch (err) {
      setListaOk(`Error: ${(err as Error).message}`)
    } finally {
      setGuardandoLista(false)
    }
  }

  const conteo = useMemo(() => {
    const c: Record<EstadoAsistencia, number> = { PRESENTE: 0, TARDE: 0, AUSENTE: 0, EXCUSA: 0 }
    for (const a of alumnosGrado) c[getEstado(a.id)]++
    return c
  }, [alumnosGrado, registros])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pasar asistencia</h1>
          <p className="text-sm text-gray-500">Escanea el QR del carnet o marca la lista por grado</p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setTab("scan")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === "scan" ? "bg-primary text-white" : "text-gray-600"
            }`}
          >
            <ScanLine className="h-4 w-4" /> Escanear QR
          </button>
          <button
            onClick={() => setTab("lista")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === "lista" ? "bg-primary text-white" : "text-gray-600"
            }`}
          >
            <ListChecks className="h-4 w-4" /> Lista (checklist)
          </button>
        </div>
      </div>

      {tab === "scan" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" /> Camara
                </CardTitle>
                <Button variant={camaraActiva ? "outline" : "default"} size="sm" onClick={camaraActiva ? detenerCamara : iniciarCamara}>
                  {camaraActiva ? "Detener" : "Activar"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-900">
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                {!camaraActiva && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <ScanLine className="h-12 w-12" />
                    <p className="mt-2 text-sm">Camara inactiva</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-primary" /> Registro manual
                </CardTitle>
                <CardDescription>Si la camara falla, pega el token o la URL del QR</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Token / URL del QR"
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && registrar(manual)}
                  />
                  <Button onClick={() => registrar(manual)} disabled={enviando || !manual.trim()}>
                    {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ultimo resultado</CardTitle>
              </CardHeader>
              <CardContent>
                {!resultado ? (
                  <p className="text-sm text-gray-500">Aun no hay escaneos.</p>
                ) : resultado.ok ? (
                  <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">{resultado.nombre}</p>
                      <p className="text-sm text-green-700">{resultado.grado}</p>
                      <p className="text-xs text-green-700">
                        {resultado.mensaje} {resultado.estado ? `· ${resultado.estado}` : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
                    <XCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-800">No valido</p>
                      <p className="text-sm text-red-700">{resultado.mensaje}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {historial.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Registros recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {historial.map((h, i) => (
                      <li key={i} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                        <span className={h.ok ? "text-gray-800" : "text-red-600"}>{h.nombre ?? h.mensaje}</span>
                        <span className="text-xs text-gray-400">{h.grado ?? ""}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" /> Lista por grado
            </CardTitle>
            <CardDescription>Marca la asistencia y guarda; los ausentes reciben aviso por correo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha</label>
                <Input type="date" value={fecha} onChange={(e) => { setFecha(e.target.value); setRegistros({}) }} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Grado</label>
                <select
                  value={gradoId}
                  onChange={(e) => { setGradoId(e.target.value); setRegistros({}) }}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Selecciona un grado</option>
                  {(grados ?? []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                      {g._count ? ` (${g._count.alumnos})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!gradoId ? (
              <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">Selecciona un grado para ver la lista</p>
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success">{conteo.PRESENTE} presentes</Badge>
                    <Badge variant="warning">{conteo.TARDE} tardes</Badge>
                    <Badge variant="destructive">{conteo.AUSENTE} ausentes</Badge>
                    <Badge variant="secondary">{conteo.EXCUSA} excusas</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => marcarTodos("PRESENTE")}>
                      <CheckCheck className="mr-1 h-3 w-3" /> Todos presentes
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => marcarTodos("AUSENTE")}>
                      Todos ausentes
                    </Button>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left">
                        <th className="pb-3 pr-4 font-medium text-gray-500">Codigo</th>
                        <th className="pb-3 pr-4 font-medium text-gray-500">Alumno</th>
                        <th className="pb-3 font-medium text-gray-500">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnosGrado.map((a) => (
                        <tr key={a.id} className="border-b border-gray-100 last:border-0">
                          <td className="py-3 pr-4 text-gray-500">{a.codigo}</td>
                          <td className="py-3 pr-4 font-medium text-gray-900">
                            {a.nombre} {a.apellido}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1.5">
                              {ESTADOS.map((est) => {
                                const active = getEstado(a.id) === est
                                return (
                                  <button
                                    key={est}
                                    onClick={() => setRegistros((p) => ({ ...p, [a.id]: est }))}
                                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                      active ? ESTADO_STYLE[est] : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    }`}
                                  >
                                    {ESTADO_LABEL[est]}
                                  </button>
                                )
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-end gap-3">
                  {listaOk && <span className="text-xs text-green-700">{listaOk}</span>}
                  <Button onClick={guardarLista} disabled={guardandoLista}>
                    {guardandoLista ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar asistencia
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
