import { useState } from "react"
import { MessageSquare, Send, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Mensaje {
  id: string
  de: string
  rol: string
  contenido: string
  fecha: string
  leido: boolean
}

const mockConversacion: Mensaje[] = [
  {
    id: "1",
    de: "Prof. Lopez",
    rol: "Matematicas",
    contenido:
      "Buenas tardes, le informo que su hijo tiene pendiente la tarea de algebra para el viernes.",
    fecha: new Date(Date.now() - 86400000).toISOString(),
    leido: true,
  },
  {
    id: "2",
    de: "Direccion",
    rol: "Administracion",
    contenido:
      "Se recuerda que la reunion de padres es el proximo viernes a las 14:00 horas.",
    fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
    leido: true,
  },
]

export default function MensajesPage() {
  const [mensaje, setMensaje] = useState("")
  const [enviado, setEnviado] = useState(false)

  const handleSend = () => {
    if (!mensaje.trim()) return
    setEnviado(true)
    setTimeout(() => {
      setEnviado(false)
      setMensaje("")
    }, 1200)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-500">Comunicacion con el colegio</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Bandeja de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mockConversacion.map((m) => (
            <div
              key={m.id}
              className="mb-4 rounded-lg border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{m.de}</p>
                  <p className="text-xs text-gray-500">{m.rol}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {new Date(m.fecha).toLocaleDateString("es-GT")}
                  </Badge>
                  {m.leido ? (
                    <Badge variant="outline" className="text-[10px]">
                      Leido
                    </Badge>
                  ) : (
                    <Badge className="text-[10px]">Nuevo</Badge>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">{m.contenido}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enviar Mensaje</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded-md border border-gray-300 p-3 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            rows={3}
            placeholder="Escribe tu mensaje a la direccion o profesores..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={handleSend} disabled={!mensaje.trim() || enviado}>
              {enviado ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Mensaje
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
