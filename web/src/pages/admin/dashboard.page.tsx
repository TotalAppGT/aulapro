import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Users,
  Banknote,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  CreditCard,
  Megaphone,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet } from "@/lib/api"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import { Link } from "react-router-dom"

interface DashboardStats {
  totalAlumnos: number
  pagosDelMes: number
  totalRecaudado: number
  totalPendiente: number
  moraActual: number
  porcentajeCompletado: number
  proximaFechaCobro: string
  comisionDelMes: number
}

interface PagoReciente {
  id: string
  alumnoNombre: string
  gradoNombre: string
  monto: number
  fecha: string
  estado: "pagado" | "pendiente" | "vencido"
}

interface MesPago {
  mes: string
  recaudado: number
  pendiente: number
}

interface DashboardResumen {
  inasistencias: {
    hoy: number
    presentesHoy: number
    tardesHoy: number
    totalHoy: number
    ausentesHoy: { alumno: string; grado: string }[]
  }
  asistenciaPorGrado: {
    gradoId: string
    grado: string
    alumnos: number
    total: number
    presentes: number
    ausentes: number
    porcentaje: number
  }[]
  clasesEnVivo: { id: string; titulo: string; curso: string; fecha: string; url: string }[]
  morosos: { alumnoId: string; alumno: string; grado: string; monto: number; meses: number }[]
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function getMonthOptions() {
  const now = new Date()
  const options = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`,
    })
  }
  return options
}

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  )

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["admin-stats", user?.colegioId, selectedMonth],
    queryFn: () =>
      apiGet<DashboardStats>(
        `/${user?.colegioId}/dashboard/stats`,
        { mes: selectedMonth }
      ),
    staleTime: 30000,
  })

  const displayStats = stats ?? {
    totalAlumnos: 0,
    pagosDelMes: 0,
    totalRecaudado: 0,
    totalPendiente: 0,
    moraActual: 0,
    porcentajeCompletado: 0,
    proximaFechaCobro: new Date().toISOString(),
    comisionDelMes: 0,
  }

  const { data: historial } = useQuery<MesPago[]>({
    queryKey: ["admin-historial", user?.colegioId],
    queryFn: () =>
      apiGet<MesPago[]>(`/${user?.colegioId}/dashboard/historial`),
    staleTime: 60000,
  })

  const { data: pagosRecientes } = useQuery<{
    cobros: (Omit<PagoReciente, "fecha"> & { fechaPago: string | null })[]
  }>({
    queryKey: ["admin-recientes", user?.colegioId],
    queryFn: () =>
      apiGet<{ cobros: (Omit<PagoReciente, "fecha"> & { fechaPago: string | null })[] }>(
        `/${user?.colegioId}/pagos`
      ),
    staleTime: 60000,
  })

  const { data: resumen } = useQuery<DashboardResumen>({
    queryKey: ["admin-resumen", user?.colegioId],
    queryFn: () => apiGet<DashboardResumen>(`/${user?.colegioId}/dashboard/resumen`),
    staleTime: 30000,
  })

  const actividadReciente = useMemo(() => {
    const real = (pagosRecientes?.cobros ?? [])
      .filter((c) => c.fechaPago)
      .sort(
        (a, b) =>
          new Date(b.fechaPago!).getTime() - new Date(a.fechaPago!).getTime()
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        alumnoNombre: c.alumnoNombre,
        gradoNombre: c.gradoNombre,
        monto: c.monto,
        fecha: c.fechaPago as string,
        estado: c.estado,
      }))
    return real
  }, [pagosRecientes])

  const maxRecaudado = useMemo(() => {
    const h = historial ?? []
    return Math.max(1, ...h.map((m) => Math.max(m.recaudado, m.pendiente)))
  }, [historial])

  const monthOptions = getMonthOptions()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Resumen general de {user?.colegioNombre}
          </p>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Alumnos
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {displayStats.totalAlumnos}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-green-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>Activos este ciclo</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Pagos del Mes
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {formatCurrency(displayStats.totalRecaudado)}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              <span>
                {displayStats.pagosDelMes} pagos ({displayStats.porcentajeCompletado}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Mora Actual</p>
                <p className="mt-1 text-3xl font-bold text-red-600">
                  {formatCurrency(displayStats.moraActual)}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-red-600">
              <TrendingDown className="mr-1 h-3 w-3" />
              <span>
                Pendiente: {formatCurrency(displayStats.totalPendiente)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Proximo Cobro
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {formatDateShort(displayStats.proximaFechaCobro)}
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-purple-600">
              <Clock className="mr-1 h-3 w-3" />
              <span>Comision: {formatCurrency(displayStats.comisionDelMes)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {resumen && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asistencia de hoy</CardTitle>
              <CardDescription>Registros de hoy</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {resumen.inasistencias.presentesHoy}
                <span className="text-base font-normal text-gray-400">
                  /{resumen.inasistencias.totalHoy}
                </span>
              </p>
              <p className="text-xs text-gray-500">presentes</p>
              <div className="mt-3 flex gap-3 text-xs">
                <span className="text-red-600">{resumen.inasistencias.hoy} ausentes</span>
                <span className="text-yellow-600">{resumen.inasistencias.tardesHoy} tardes</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inasistencias de hoy</CardTitle>
              <CardDescription>Alumnos ausentes</CardDescription>
            </CardHeader>
            <CardContent>
              {resumen.inasistencias.ausentesHoy.length === 0 ? (
                <p className="text-sm text-gray-500">Sin inasistencias registradas.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {resumen.inasistencias.ausentesHoy.map((a, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="truncate text-gray-800">{a.alumno}</span>
                      <span className="ml-2 shrink-0 text-xs text-gray-400">{a.grado}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clases en vivo</CardTitle>
              <CardDescription>Proximas sesiones</CardDescription>
            </CardHeader>
            <CardContent>
              {resumen.clasesEnVivo.length === 0 ? (
                <p className="text-sm text-gray-500">No hay clases programadas.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {resumen.clasesEnVivo.map((c) => (
                    <li key={c.id} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-800">{c.titulo}</p>
                        <p className="text-xs text-gray-500">
                          {c.curso} · {formatDateShort(c.fecha)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {resumen && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Asistencia por grado (mes)</CardTitle>
              <CardDescription>Porcentaje de asistencia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resumen.asistenciaPorGrado.map((g) => (
                  <div key={g.gradoId}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-700">{g.grado}</span>
                      <span className="text-xs text-gray-500">
                        {g.ausentes} faltas · {g.porcentaje}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${
                          g.porcentaje >= 90
                            ? "bg-green-500"
                            : g.porcentaje >= 75
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(g.porcentaje, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alumnos con saldo pendiente</CardTitle>
              <CardDescription>Mayores montos adeudados</CardDescription>
            </CardHeader>
            <CardContent>
              {resumen.morosos.length === 0 ? (
                <p className="text-sm text-gray-500">Sin saldos pendientes.</p>
              ) : (
                <ul className="space-y-3">
                  {resumen.morosos.map((m) => (
                    <li key={m.alumnoId} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{m.alumno}</p>
                        <p className="text-xs text-gray-500">
                          {m.grado} · {m.meses} mes(es)
                        </p>
                      </div>
                      <span className="ml-2 shrink-0 text-sm font-semibold text-red-600">
                        {formatCurrency(m.monto)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historial de Pagos (6 meses)</CardTitle>
            <CardDescription>
              Recaudado vs Pendiente por mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <div className="flex h-full items-end gap-4">
                {(historial ?? []).map((mes, i) => {
                  const [, month] = mes.mes.split("-")
                  const label = MONTHS_ES[parseInt(month) - 1].slice(0, 3)
                  const recaudadoHeight =
                    (mes.recaudado / maxRecaudado) * 100
                  const pendienteHeight =
                    (mes.pendiente / maxRecaudado) * 100
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex w-full items-end gap-1">
                        <div
                          className="flex-1 rounded-t bg-primary transition-all"
                          style={{ height: `${recaudadoHeight}%` }}
                        />
                        <div
                          className="flex-1 rounded-t bg-red-200 transition-all"
                          style={{ height: `${pendienteHeight}%` }}
                        />
                      </div>
                      <div className="flex h-40 w-full flex-col justify-end" />
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-primary" />
                <span className="text-gray-600">Recaudado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-200" />
                <span className="text-gray-600">Pendiente</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Ultimos pagos recibidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actividadReciente.map((pago) => (
                <div
                  key={pago.id}
                  className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {pago.alumnoNombre}
                    </p>
                    <p className="text-xs text-gray-500">{pago.gradoNombre}</p>
                    <p className="text-xs text-gray-400">
                      {formatDateShort(pago.fecha)}
                    </p>
                  </div>
                  <div className="ml-3 flex flex-col items-end">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(pago.monto)}
                    </span>
                    <Badge
                      variant={
                        pago.estado === "pagado"
                          ? "success"
                          : pago.estado === "vencido"
                          ? "destructive"
                          : "warning"
                      }
                      className="mt-1 text-[10px]"
                    >
                      {pago.estado === "pagado"
                        ? "Pagado"
                        : pago.estado === "vencido"
                        ? "Vencido"
                        : "Pendiente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones Rapidas</CardTitle>
          <CardDescription>
            Accesos directos a las funciones mas usadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link to="/app/pagos">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CreditCard className="h-4 w-4" />
                Generar Cobros del Mes
              </Button>
            </Link>
            <Link to="/app/anuncios">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Megaphone className="h-4 w-4" />
                Crear Anuncio
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start gap-2">
              <FileBarChart className="h-4 w-4" />
              Ver Reportes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
