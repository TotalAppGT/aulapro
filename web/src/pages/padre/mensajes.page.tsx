import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MessageSquare, Send, Loader2, Inbox } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"

interface Interlocutor {
  id: string
  nombre: string
  rol: string
}

interface Mensaje {
  id: string
  remitenteId: string
  destinatarioId: string
  contenido: string
  leido: boolean
  createdAt: string
  remitente: Interlocutor
  destinatario: Interlocutor
}

const ROL_LABEL: Record<string, string> = {
  ADMIN_COLEGIO: "Administracion",
  SUPERADMIN: "Plataforma",
  PROFESOR: "Profesor",
  PADRE: "Padre de familia",
  ALUMNO: "Alumno",
}

export default function MensajesPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [mensaje, setMensaje] = useState("")

  const { data: mensajes, isLoading } = useQuery<Mensaje[]>({
    queryKey: ["mensajes", user?.colegioId],
    queryFn: () => apiGet<Mensaje[]>(`/${user?.colegioId}/mensajes`),
    enabled: !!user?.colegioId,
  })

  const sendMutation = useMutation({
    mutationFn: () => apiPost(`/${user?.colegioId}/mensajes`, { contenido: mensaje }),
    onSuccess: () => {
      setMensaje("")
      queryClient.invalidateQueries({ queryKey: ["mensajes"] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-500">Comunicacion con el colegio</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            Bandeja de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
          ) : !mensajes || mensajes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No hay mensajes aun</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mensajes.map((m) => {
                const recibido = m.remitenteId === user?.id ? false : true
                const otro = recibido ? m.remitente : m.destinatario
                return (
                  <div
                    key={m.id}
                    className={`rounded-lg border p-4 ${
                      recibido && !m.leido ? "border-primary bg-primary-50" : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {recibido ? "De: " : "Para: "}
                          {otro.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ROL_LABEL[otro.rol] ?? otro.rol}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {new Date(m.createdAt).toLocaleDateString("es-GT", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Badge>
                        {recibido &&
                          (m.leido ? (
                            <Badge variant="outline" className="text-[10px]">
                              Leido
                            </Badge>
                          ) : (
                            <Badge className="text-[10px]">Nuevo</Badge>
                          ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{m.contenido}</p>
                  </div>
                )
              })}
            </div>
          )}
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
            placeholder="Escribe tu mensaje a la direccion del colegio..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!mensaje.trim() || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
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
