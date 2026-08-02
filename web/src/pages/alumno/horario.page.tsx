import { Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Clase {
  id: string
  materia: string
  profesor: string
  horaInicio: string
  horaFin: string
  aula: string
}

const horarioSemana: Record<string, Clase[]> = {
  Lunes: [
    { id: "1", materia: "Matematicas", profesor: "Prof. Lopez", horaInicio: "07:00", horaFin: "07:45", aula: "A-101" },
    { id: "2", materia: "Ciencias Naturales", profesor: "Prof. Martinez", horaInicio: "07:45", horaFin: "08:30", aula: "Lab-2" },
    { id: "3", materia: "Idioma Espanol", profesor: "Prof. Rodriguez", horaInicio: "09:00", horaFin: "09:45", aula: "B-203" },
  ],
  Martes: [
    { id: "4", materia: "Estudios Sociales", profesor: "Prof. Gomez", horaInicio: "07:00", horaFin: "07:45", aula: "B-201" },
    { id: "5", materia: "Matematicas", profesor: "Prof. Lopez", horaInicio: "08:30", horaFin: "09:15", aula: "A-101" },
    { id: "6", materia: "Educacion Fisica", profesor: "Prof. Mendez", horaInicio: "10:30", horaFin: "11:15", aula: "Cancha" },
  ],
  Miercoles: [
    { id: "7", materia: "Idioma Espanol", profesor: "Prof. Rodriguez", horaInicio: "07:00", horaFin: "07:45", aula: "B-203" },
    { id: "8", materia: "Ciencias Naturales", profesor: "Prof. Martinez", horaInicio: "09:00", horaFin: "09:45", aula: "Lab-2" },
    { id: "9", materia: "Estudios Sociales", profesor: "Prof. Gomez", horaInicio: "10:30", horaFin: "11:15", aula: "B-201" },
  ],
  Jueves: [
    { id: "10", materia: "Matematicas", profesor: "Prof. Lopez", horaInicio: "08:30", horaFin: "09:15", aula: "A-101" },
    { id: "11", materia: "Educacion Fisica", profesor: "Prof. Mendez", horaInicio: "09:45", horaFin: "10:30", aula: "Cancha" },
    { id: "12", materia: "Idioma Espanol", profesor: "Prof. Rodriguez", horaInicio: "11:15", horaFin: "12:00", aula: "B-203" },
  ],
  Viernes: [
    { id: "13", materia: "Ciencias Naturales", profesor: "Prof. Martinez", horaInicio: "07:00", horaFin: "07:45", aula: "Lab-2" },
    { id: "14", materia: "Estudios Sociales", profesor: "Prof. Gomez", horaInicio: "08:30", horaFin: "09:15", aula: "B-201" },
    { id: "15", materia: "Matematicas", profesor: "Prof. Lopez", horaInicio: "10:30", horaFin: "11:15", aula: "A-101" },
  ],
}

const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]

export default function HorarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Horario</h1>
        <p className="text-sm text-gray-500">Horario de clases semanal</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {DIAS.map((dia) => {
          const clases = horarioSemana[dia] ?? []
          return (
            <Card key={dia}>
              <CardHeader className="border-b border-gray-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-primary" />
                  {dia}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {clases.map((clase) => (
                    <div key={clase.id} className="rounded-lg border border-gray-100 p-3">
                      <p className="text-sm font-medium text-gray-900">
                        {clase.materia}
                      </p>
                      <p className="text-xs text-gray-500">{clase.profesor}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          {clase.horaInicio} - {clase.horaFin}
                        </Badge>
                        <span className="text-[10px] text-gray-400">{clase.aula}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
