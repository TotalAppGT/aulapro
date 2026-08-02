import {
  Clock,
  BookOpen,
  Megaphone,
  Star,
  Upload,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth.store"
import { formatDate, formatDateShort } from "@/lib/utils"

interface HorarioClase {
  id: string
  materia: string
  profesor: string
  horaInicio: string
  horaFin: string
  aula: string
}

interface TareaPendiente {
  id: string
  titulo: string
  materia: string
  profesor: string
  fechaEntrega: string
  descripcion: string
  estado: "pendiente" | "entregada" | "calificada"
  nota?: number
}

interface AnuncioItem {
  id: string
  titulo: string
  contenido: string
  autor: string
  fecha: string
}

interface ExamenProximo {
  id: string
  materia: string
  tema: string
  fecha: string
  hora: string
}

interface UltimaNota {
  id: string
  materia: string
  nota: number
  tipo: string
  fecha: string
}

const mockHorarioHoy: HorarioClase[] = [
  {
    id: "1",
    materia: "Matematicas",
    profesor: "Prof. Lopez",
    horaInicio: "07:00",
    horaFin: "07:45",
    aula: "A-101",
  },
  {
    id: "2",
    materia: "Ciencias Naturales",
    profesor: "Prof. Martinez",
    horaInicio: "07:45",
    horaFin: "08:30",
    aula: "Lab-2",
  },
  {
    id: "3",
    materia: "Recreo",
    profesor: "",
    horaInicio: "08:30",
    horaFin: "09:00",
    aula: "Patio",
  },
  {
    id: "4",
    materia: "Idioma Espanol",
    profesor: "Prof. Rodriguez",
    horaInicio: "09:00",
    horaFin: "09:45",
    aula: "B-203",
  },
  {
    id: "5",
    materia: "Estudios Sociales",
    profesor: "Prof. Gomez",
    horaInicio: "09:45",
    horaFin: "10:30",
    aula: "B-201",
  },
  {
    id: "6",
    materia: "Educacion Fisica",
    profesor: "Prof. Mendez",
    horaInicio: "10:30",
    horaFin: "11:15",
    aula: "Cancha",
  },
]

const mockTareas: TareaPendiente[] = [
  {
    id: "1",
    titulo: "Ejercicios de algebra",
    materia: "Matematicas",
    profesor: "Prof. Lopez",
    fechaEntrega: new Date(Date.now() + 86400000 * 2).toISOString(),
    descripcion: "Resolver ejercicios del 1 al 20 del capitulo 5.",
    estado: "pendiente",
  },
  {
    id: "2",
    titulo: "Reporte de laboratorio",
    materia: "Ciencias Naturales",
    profesor: "Prof. Martinez",
    fechaEntrega: new Date(Date.now() + 86400000).toISOString(),
    descripcion: "Escribir reporte del experimento de la celula vegetal.",
    estado: "pendiente",
  },
  {
    id: "3",
    titulo: "Ensayo: La independencia",
    materia: "Estudios Sociales",
    profesor: "Prof. Gomez",
    fechaEntrega: new Date(Date.now() - 86400000).toISOString(),
    descripcion: "Ensayo de 2 paginas sobre la independencia de Guatemala.",
    estado: "entregada",
    nota: 85,
  },
  {
    id: "4",
    titulo: "Analisis de poema",
    materia: "Idioma Espanol",
    profesor: "Prof. Rodriguez",
    fechaEntrega: new Date(Date.now() + 86400000 * 5).toISOString(),
    descripcion: "Analizar el poema 'A Guatemala' de Jose Batres Montufar.",
    estado: "pendiente",
  },
]

const mockAnuncios: AnuncioItem[] = [
  {
    id: "1",
    titulo: "Reunion de padres de familia",
    contenido:
      "Se les recuerda que el proximo viernes habra reunion general de padres de familia a las 14:00 horas.",
    autor: "Direccion",
    fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "2",
    titulo: "Suspension de clases",
    contenido:
      "El dia lunes no habra clases por capacitacion docente programada por el MINEDUC.",
    autor: "Direccion",
    fecha: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    titulo: "Feria de ciencias",
    contenido:
      "Inscripciones abiertas para la feria de ciencias anual. Fecha limite: proxima semana.",
    autor: "Prof. Martinez",
    fecha: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
]

const mockExamenes: ExamenProximo[] = [
  {
    id: "1",
    materia: "Matematicas",
    tema: "Ecuaciones cuadraticas",
    fecha: new Date(Date.now() + 86400000 * 5).toISOString(),
    hora: "07:00",
  },
  {
    id: "2",
    materia: "Idioma Espanol",
    tema: "Literatura guatemalteca",
    fecha: new Date(Date.now() + 86400000 * 7).toISOString(),
    hora: "08:00",
  },
]

const mockNotas: UltimaNota[] = [
  {
    id: "1",
    materia: "Matematicas",
    nota: 92,
    tipo: "Examen",
    fecha: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "2",
    materia: "Ciencias Naturales",
    nota: 78,
    tipo: "Laboratorio",
    fecha: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "3",
    materia: "Estudios Sociales",
    nota: 85,
    tipo: "Ensayo",
    fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "4",
    materia: "Idioma Espanol",
    nota: 90,
    tipo: "Examen oral",
    fecha: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
]

function getNotaColor(nota: number): string {
  if (nota >= 90) return "text-green-600"
  if (nota >= 70) return "text-yellow-600"
  return "text-red-600"
}

function getNotaBg(nota: number): string {
  if (nota >= 90) return "bg-green-50"
  if (nota >= 70) return "bg-yellow-50"
  return "bg-red-50"
}

export default function AlumnoDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const today = new Date()

  const isRecreo = (clase: HorarioClase) =>
    clase.materia.toLowerCase().includes("recreo")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {user?.nombre.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500">
          Hoy es {formatDate(today.toISOString())}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Mi Horario Hoy</CardTitle>
              </div>
              <CardDescription>
                Clases programadas para el dia de hoy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockHorarioHoy.map((clase, i) => {
                  const now = new Date()
                  const [hInicio, mInicio] = clase.horaInicio.split(":").map(Number)
                  const [hFin, mFin] = clase.horaFin.split(":").map(Number)
                  const inicioMin = hInicio * 60 + mInicio
                  const finMin = hFin * 60 + mFin
                  const ahoraMin = now.getHours() * 60 + now.getMinutes()
                  const isActive =
                    !isRecreo(clase) &&
                    ahoraMin >= inicioMin &&
                    ahoraMin <= finMin

                  return (
                    <div
                      key={clase.id}
                      className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                        isActive
                          ? "border-primary bg-primary-50"
                          : isRecreo(clase)
                          ? "border-green-200 bg-green-50/50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isActive
                            ? "bg-primary text-white"
                            : isRecreo(clase)
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${
                            isActive ? "text-primary-900" : "text-gray-900"
                          }`}
                        >
                          {clase.materia}
                        </p>
                        {!isRecreo(clase) && (
                          <p className="text-xs text-gray-500">
                            {clase.profesor} &middot; {clase.aula}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`text-sm font-medium ${
                            isActive ? "text-primary-700" : "text-gray-500"
                          }`}
                        >
                          {clase.horaInicio} - {clase.horaFin}
                        </span>
                        {isActive && (
                          <Badge
                            variant="default"
                            className="ml-2 text-[10px]"
                          >
                            Ahora
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle>Tareas Pendientes</CardTitle>
                </div>
                <span className="text-sm text-gray-500">
                  {mockTareas.filter((t) => t.estado === "pendiente").length}{" "}
                  pendientes
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {mockTareas.map((tarea) => {
                  const isOverdue =
                    new Date(tarea.fechaEntrega) < new Date() &&
                    tarea.estado === "pendiente"
                  return (
                    <div
                      key={tarea.id}
                      className={`rounded-lg border p-4 ${
                        isOverdue
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {tarea.titulo}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {tarea.materia} &middot; {tarea.profesor}
                          </p>
                        </div>
                        <Badge
                          variant={
                            tarea.estado === "entregada"
                              ? "success"
                              : tarea.estado === "calificada"
                              ? "secondary"
                              : isOverdue
                              ? "destructive"
                              : "warning"
                          }
                          className="text-[10px]"
                        >
                          {tarea.estado === "pendiente"
                            ? isOverdue
                              ? "Vencida"
                              : "Pendiente"
                            : tarea.estado === "entregada"
                            ? "Entregada"
                            : `Nota: ${tarea.nota}`}
                        </Badge>
                      </div>

                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {tarea.descripcion}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span
                            className={isOverdue ? "text-red-600 font-medium" : ""}
                          >
                            {isOverdue
                              ? "Vencida: "
                              : "Entrega: "}
                            {formatDateShort(tarea.fechaEntrega)}
                          </span>
                        </div>

                        {tarea.estado === "pendiente" && (
                          <Button size="sm" variant="outline">
                            <Upload className="mr-1 h-3 w-3" />
                            Entregar
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Proximos Examenes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {mockExamenes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay examenes proximos
                </p>
              ) : (
                <div className="space-y-3">
                  {mockExamenes.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-start gap-3 rounded-md border border-orange-100 bg-orange-50/50 p-3"
                    >
                      <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {exam.materia}
                        </p>
                        <p className="text-xs text-gray-500">{exam.tema}</p>
                        <p className="mt-1 text-xs font-medium text-orange-600">
                          {formatDateShort(exam.fecha)} &middot; {exam.hora}
                        </p>
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
                <Star className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">Ultimas Notas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockNotas.map((nota) => (
                  <div
                    key={nota.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {nota.materia}
                      </p>
                      <p className="text-xs text-gray-500">
                        {nota.tipo} &middot; {formatDateShort(nota.fecha)}
                      </p>
                    </div>
                    <div
                      className={`ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${getNotaBg(
                        nota.nota
                      )} ${getNotaColor(nota.nota)}`}
                    >
                      {nota.nota}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Anuncios</CardTitle>
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
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <span>{anuncio.autor}</span>
                      <span>&middot;</span>
                      <span>{formatDateShort(anuncio.fecha)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
