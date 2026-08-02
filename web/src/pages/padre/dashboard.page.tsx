import { useState } from "react"
import {
  Users,
  DollarSign,
  BookOpen,
  Megaphone,
  MessageSquare,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Star,
  Calendar,
  Send,
  GraduationCap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth.store"
import { formatCurrency, formatDateShort } from "@/lib/utils"

interface HijoInfo {
  id: string
  nombre: string
  grado: string
  gradoNombre: string
  avatar?: string
}

interface NotaResumen {
  materia: string
  promedio: number
}

interface TareaResumen {
  id: string
  titulo: string
  materia: string
  fechaEntrega: string
  estado: "pendiente" | "entregada" | "vencida"
}

interface PagoStatus {
  mes: string
  monto: number
  estado: "pagado" | "pendiente" | "vencido"
  fechaLimite: string
}

interface AnuncioItem {
  id: string
  titulo: string
  contenido: string
  fecha: string
}

const mockHijos: HijoInfo[] = [
  {
    id: "h1",
    nombre: "Maria Garcia",
    grado: "3ro Basico",
    gradoNombre: "3ro Basico A",
  },
  {
    id: "h2",
    nombre: "Carlos Garcia",
    grado: "5to Primaria",
    gradoNombre: "5to Primaria B",
  },
]

const mockNotasPorHijo: Record<string, NotaResumen[]> = {
  h1: [
    { materia: "Matematicas", promedio: 85 },
    { materia: "Ciencias Naturales", promedio: 78 },
    { materia: "Idioma Espanol", promedio: 92 },
    { materia: "Estudios Sociales", promedio: 88 },
    { materia: "Ingles", promedio: 90 },
  ],
  h2: [
    { materia: "Matematicas", promedio: 95 },
    { materia: "Ciencias Naturales", promedio: 88 },
    { materia: "Idioma Espanol", promedio: 82 },
    { materia: "Estudios Sociales", promedio: 91 },
  ],
}

const mockTareasPorHijo: Record<string, TareaResumen[]> = {
  h1: [
    {
      id: "t1",
      titulo: "Ejercicios de algebra",
      materia: "Matematicas",
      fechaEntrega: new Date(Date.now() + 86400000 * 2).toISOString(),
      estado: "pendiente",
    },
    {
      id: "t2",
      titulo: "Reporte de laboratorio",
      materia: "Ciencias Naturales",
      fechaEntrega: new Date(Date.now() - 86400000).toISOString(),
      estado: "vencida",
    },
    {
      id: "t3",
      titulo: "Ensayo de historia",
      materia: "Estudios Sociales",
      fechaEntrega: new Date(Date.now() + 86400000 * 4).toISOString(),
      estado: "pendiente",
    },
  ],
  h2: [
    {
      id: "t4",
      titulo: "Tablas de multiplicar",
      materia: "Matematicas",
      fechaEntrega: new Date(Date.now() + 86400000).toISOString(),
      estado: "pendiente",
    },
    {
      id: "t5",
      titulo: "Lectura comprensiva",
      materia: "Idioma Espanol",
      fechaEntrega: new Date(Date.now() + 86400000 * 3).toISOString(),
      estado: "pendiente",
    },
  ],
}

const mockPagosPorHijo: Record<string, PagoStatus> = {
  h1: {
    mes: "Agosto 2026",
    monto: 225,
    estado: "pendiente",
    fechaLimite: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString(),
  },
  h2: {
    mes: "Agosto 2026",
    monto: 225,
    estado: "pagado",
    fechaLimite: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString(),
  },
}

const mockAnuncios: AnuncioItem[] = [
  {
    id: "1",
    titulo: "Reunion de padres de familia",
    contenido:
      "Se les recuerda que el proximo viernes habra reunion general de padres de familia a las 14:00 horas.",
    fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "2",
    titulo: "Suspension de clases",
    contenido:
      "El dia lunes no habra clases por capacitacion docente programada por el MINEDUC.",
    fecha: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    titulo: "Feria de ciencias",
    contenido:
      "Inscripciones abiertas para la feria de ciencias anual. Apoye a su hijo(a) a participar.",
    fecha: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
]

function getNotaColor(nota: number): string {
  if (nota >= 90) return "text-green-600"
  if (nota >= 70) return "text-yellow-600"
  return "text-red-600"
}

export default function PadreDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [activeHijo, setActiveHijo] = useState<string>(mockHijos[0].id)

  const hijoActual = mockHijos.find((h) => h.id === activeHijo)!
  const notas = mockNotasPorHijo[activeHijo] ?? []
  const tareas = mockTareasPorHijo[activeHijo] ?? []
  const pago = mockPagosPorHijo[activeHijo]
  const tareasPendientes = tareas.filter((t) => t.estado !== "entregada").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {user?.nombre.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500">
          Panel de seguimiento para padres
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="mr-3 text-sm font-medium text-gray-700">
              Mis Hijos:
            </span>
            {mockHijos.map((hijo) => (
              <button
                key={hijo.id}
                onClick={() => setActiveHijo(hijo.id)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeHijo === hijo.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {hijo.nombre}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Grado</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {hijoActual.gradoNombre}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      tareasPendientes > 0 ? "bg-yellow-50" : "bg-green-50"
                    }`}
                  >
                    <BookOpen
                      className={`h-5 w-5 ${
                        tareasPendientes > 0
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Tareas Pendientes
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {tareasPendientes}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      pago.estado === "pagado"
                        ? "bg-green-50"
                        : pago.estado === "vencido"
                        ? "bg-red-50"
                        : "bg-yellow-50"
                    }`}
                  >
                    <DollarSign
                      className={`h-5 w-5 ${
                        pago.estado === "pagado"
                          ? "text-green-600"
                          : pago.estado === "vencido"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Pago {pago.mes}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(pago.monto)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <CardTitle>Resumen de Calificaciones</CardTitle>
              </div>
              <CardDescription>
                Promedios actuales de {hijoActual.nombre}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notas.length === 0 ? (
                <p className="text-sm text-gray-500">No hay notas registradas</p>
              ) : (
                <div className="space-y-3">
                  {notas.map((nota) => (
                    <div
                      key={nota.materia}
                      className="flex items-center justify-between rounded-md border border-gray-100 p-3"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {nota.materia}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-32 rounded-full bg-gray-100">
                          <div
                            className={`h-2 rounded-full ${
                              nota.promedio >= 90
                                ? "bg-green-500"
                                : nota.promedio >= 70
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(nota.promedio, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-bold ${getNotaColor(
                            nota.promedio
                          )}`}
                        >
                          {nota.promedio}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Tareas de {hijoActual.nombre}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {tareas.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay tareas pendientes
                </p>
              ) : (
                <div className="space-y-3">
                  {tareas.map((tarea) => (
                    <div
                      key={tarea.id}
                      className={`flex items-center justify-between rounded-md border p-3 ${
                        tarea.estado === "vencida"
                          ? "border-red-200 bg-red-50"
                          : "border-gray-100"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tarea.titulo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tarea.materia} &middot; Entrega:{" "}
                          {formatDateShort(tarea.fechaEntrega)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          tarea.estado === "entregada"
                            ? "success"
                            : tarea.estado === "vencida"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[10px]"
                      >
                        {tarea.estado === "pendiente"
                          ? "Pendiente"
                          : tarea.estado === "vencida"
                          ? "Vencida"
                          : "Entregada"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Pagos Pendientes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`rounded-lg border p-4 ${
                  pago.estado === "pagado"
                    ? "border-green-200 bg-green-50"
                    : pago.estado === "vencido"
                    ? "border-red-200 bg-red-50"
                    : "border-yellow-200 bg-yellow-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {hijoActual.nombre}
                    </p>
                    <p className="text-xs text-gray-500">
                      {pago.mes} &middot; {formatCurrency(pago.monto)}
                    </p>
                  </div>
                  {pago.estado === "pagado" ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertCircle
                      className={`h-6 w-6 ${
                        pago.estado === "vencido"
                          ? "text-red-500"
                          : "text-yellow-500"
                      }`}
                    />
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-500">
                    {pago.estado === "pagado"
                      ? "Pagado"
                      : `Limite: ${formatDateShort(pago.fechaLimite)}`}
                  </span>
                </div>

                {pago.estado !== "pagado" && (
                  <Button className="mt-3 w-full" size="sm">
                    <DollarSign className="mr-1 h-4 w-4" />
                    Pagar ahora
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Anuncios Recientes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAnuncios.map((anuncio) => (
                  <div
                    key={anuncio.id}
                    className="rounded-md border border-gray-100 p-3"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {anuncio.titulo}
                    </p>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {anuncio.contenido}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatDateShort(anuncio.fecha)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Mensaje Rapido</CardTitle>
              </div>
              <CardDescription>
                Contacta al profesor de {hijoActual.nombre}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
                placeholder="Escribe tu mensaje..."
              />
              <Button className="mt-3 w-full" size="sm">
                <Send className="mr-1 h-3 w-3" />
                Enviar Mensaje
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
