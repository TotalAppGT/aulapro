import { useEffect, useRef, useState } from "react"
import { ScanLine, CheckCircle2, XCircle, Loader2, Camera, Keyboard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiPost } from "@/lib/api"

interface Resultado {
  ok: boolean
  mensaje: string
  nombre?: string
  grado?: string
  estado?: string
  yaRegistrado?: boolean
}

export default function AsistenciaScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<{ detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } | null>(null)
  const runningRef = useRef(false)

  const [camaraActiva, setCamaraActiva] = useState(false)
  const [soportado, setSoportado] = useState(true)
  const [manual, setManual] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [historial, setHistorial] = useState<Resultado[]>([])

  const registrar = async (qrToken: string) => {
    const token = qrToken.trim()
    if (!token || enviando) return
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
        mensaje: data.asistenciaRegistrada
          ? "Asistencia registrada (Presente)"
          : "El alumno ya tenia registro hoy",
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
      const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: new (opts?: unknown) => unknown }).BarcodeDetector
      if (!BarcodeDetectorCtor) {
        setSoportado(false)
        return
      }
      detectorRef.current = new BarcodeDetectorCtor({ formats: ["qr_code"] }) as {
        detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]>
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCamaraActiva(true)
      runningRef.current = true

      const loop = async () => {
        if (!runningRef.current || !videoRef.current || !detectorRef.current) return
        try {
          const codes = await detectorRef.current.detect(videoRef.current)
          if (codes.length > 0) {
            const raw = codes[0].rawValue
            const token = raw.split("/").filter(Boolean).pop() || raw
            await registrar(token)
            await new Promise((r) => setTimeout(r, 2500))
          }
        } catch {
          /* ignore frame errors */
        }
        if (runningRef.current) requestAnimationFrame(loop)
      }
      loop()
    } catch {
      setCamaraActiva(false)
      setSoportado(false)
    }
  }

  const detenerCamara = () => {
    runningRef.current = false
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCamaraActiva(false)
  }

  useEffect(() => {
    const soporta = "BarcodeDetector" in window
    setSoportado(soporta)
    return () => detenerCamara()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escaneo de asistencia</h1>
          <p className="text-sm text-gray-500">
            Escanea el carnet QR del alumno (kiosco o celular) para registrar su asistencia
          </p>
        </div>
        <Button variant={camaraActiva ? "outline" : "default"} onClick={camaraActiva ? detenerCamara : iniciarCamara}>
          <Camera className="mr-2 h-4 w-4" />
          {camaraActiva ? "Detener camara" : "Activar camara"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" /> Camara
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-900">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              {!camaraActiva && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <ScanLine className="h-12 w-12" />
                  <p className="mt-2 text-sm">
                    {soportado ? "Camara inactiva" : "Este navegador no soporta escaneo; usa el campo manual"}
                  </p>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Si el navegador no soporta el escaneo por camara (algunos navegadores), usa el campo
              manual con el token del QR.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-primary" /> Registro manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Token del QR o URL de verificacion"
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
                      <span className={h.ok ? "text-gray-800" : "text-red-600"}>
                        {h.nombre ?? h.mensaje}
                      </span>
                      <span className="text-xs text-gray-400">{h.grado ?? ""}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
