import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Users,
  DollarSign,
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

const mockStats: DashboardStats = {
  totalAlumnos: 245,
  pagosDelMes: 198,
  totalRecaudado: 44550,
  totalPendiente: 10575,
  moraActual: 2350,
  porcentajeCompletado: 80.8,
  proximaFechaCobro: new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1
  ).toISOString(),
  comisionDelMes: 1782,
}

const mockPagosRecientes: PagoReciente[] = [
  {
    id: "1",
    alumnoNombre: "Maria Garcia",
    gradoNombre: "3ro Basico A",
    monto: 225,
    fecha: new Date().toISOString(),
    estado: "pagado",
  },
  {
    id: "2",
    alumnoNombre: "Carlos Perez",
    gradoNombre: "5to Primaria B",
    monto: 225,
    fecha: new Date(Date.now() - 86400000).toISOString(),
    estado: "pagado",
  },
  {
    id: "3",
    alumnoNombre: "Ana Lopez",
    gradoNombre: "2do Basico A",
    monto: 225,
    fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
    estado: "pagado",
  },
  {
    id: "4",
    alumnoNombre: "Jose Mendez",
    gradoNombre: "1ro Primaria C",
    monto: 225,
    fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
    estado: "pendiente",
  },
  {
    id: "5",
    alumnoNombre: "Luisa Ramirez",
    gradoNombre: "3ro Basico B",
    monto: 225,
    fecha: new Date(Date.now() - 86400000 * 5).toISOString(),
    estado: "vencido",
  },
]

const mockHistorial: MesPago[] = [
  { mes: "2026-02", recaudado: 41000, pendiente: 8580 },
  { mes: "2026-03", recaudado: 42500, pendiente: 9100 },
  { mes: "2026-04", recaudado: 39800, pendiente: 10200 },
  { mes: "2026-05", recaudado: 43200, pendiente: 11000 },
  { mes: "2026-06", recaudado: 44000, pendiente: 10800 },
  { mes: "2026-07", recaudado: 44550, pendiente: 10575 },
]

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  )

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["admin-stats", user?.colegioId, selectedMonth],
    queryFn: () =>
      apiGet<DashboardStats>(
        `/colegios/${user?.colegioId}/dashboard/stats`,
        { mes: selectedMonth }
      ),
    placeholderData: mockStats,
    staleTime: 30000,
  })

  const displayStats = stats ?? mockStats

  const { data: historial } = useQuery<MesPago[]>({
    queryKey: ["admin-historial", user?.colegioId],
    queryFn: () =>
      apiGet<MesPago[]>(`/colegios/${user?.colegioId}/dashboard/historial`),
    placeholderData: mockHistorial,
    staleTime: 60000,
  })

  const maxRecaudado = useMemo(() => {
    const h = historial ?? mockHistorial
    return Math.max(...h.map((m) => Math.max(m.recaudado, m.pendiente)))
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
                <DollarSign className="h-6 w-6 text-green-600" />
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
                {(historial ?? mockHistorial).map((mes, i) => {
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
              {mockPagosRecientes.map((pago) => (
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
